import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';   // ✅ aggiungi Router
import { UserService } from '../../core/services/user.service';
import { PropertyService } from '../../core/services/property.service';
import { Property, ROLE_LABELS, Role, User } from '../../core/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type AdminTab = 'users' | 'properties' | 'blacklist';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private userSvc  = inject(UserService);
  private propSvc  = inject(PropertyService);
  private http     = inject(HttpClient);
  private router   = inject(Router);               // ✅ NUOVO

  protected tab        = signal<AdminTab>('users');
  protected users      = signal<User[]>([]);
  protected properties = signal<Property[]>([]);
  protected blacklist  = signal<string[]>([]);

  ngOnInit(): void {
    this.refreshUsers();
    this.refreshProperties();
  }

  roleLabel(r: Role): string { return ROLE_LABELS[r]; }

  setTab(t: AdminTab): void {
    this.tab.set(t);
    if (t === 'blacklist') this.refreshBlacklist();
  }

  private refreshUsers(): void {
    this.userSvc.list().subscribe({ next: (r) => this.users.set([...r]) });
  }

  private refreshProperties(): void {
    this.propSvc.list().subscribe({ next: (r) => this.properties.set([...r]) });
  }

  private refreshBlacklist(): void {
    this.userSvc.getBlacklist().subscribe({ next: (list) => this.blacklist.set([...list]) });
  }

  toggleBan(u: User): void {
    const action$ = u.banned ? this.userSvc.unban(u.email) : this.userSvc.ban(u.email);
    action$.subscribe({
      next: () => this.users.update((arr) =>
          arr.map((x) => x.id === u.id ? { ...x, banned: !u.banned } : x)
      ),
      error: (e) => alert('Errore: ' + e.error),
    });
  }

  unbanFromBlacklist(email: string): void {
    if (!confirm(`Sbloccare ${email} dalla blacklist?`)) return;
    this.userSvc.unban(email).subscribe({
      next: () => {
        this.refreshBlacklist();
        this.users.update((arr) =>
            arr.map((x) => x.email === email ? { ...x, banned: false } : x)
        );
      },
      error: (e) => alert('Errore: ' + e.error),
    });
  }

  deleteUser(u: User): void {
    if (!confirm(`Eliminare ${u.name} ${u.surname}?`)) return;
    this.userSvc.delete(u.id, u.role).subscribe({
      next: () => this.users.update((arr) => arr.filter((x) => x.id !== u.id)),
      error: (e) => alert('Errore eliminazione utente: ' + e.error),
    });
  }

  deleteProperty(p: Property): void {
    if (!confirm(`Eliminare "${p.title}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/posts/${p.id}`, { responseType: 'text' })
        .subscribe({
          next: () => this.properties.update((arr) => arr.filter((x) => x.id !== p.id)),
          error: (e) => {
            const msg = e?.error?.message || e?.error || e?.message || 'Errore sconosciuto durante l\'eliminazione.';
            alert('Errore eliminazione annuncio: ' + msg);
          },
        });
  }

  editProperty(p: Property): void {
    this.router.navigate(['/seller/edit', p.id]);
  }

  promoteToAdmin(u: User): void {
    if (u.role !== 'BUYER') {
      alert('Solo gli acquirenti (BUYER) possono essere promossi ad Amministratore.');
      return;
    }
    if (!confirm(`Promuovere ${u.name} ${u.surname} ad Amministratore?\n\nAttenzione: questa azione è irreversibile.`)) return;
    this.userSvc.promote(u.email).subscribe({
      next: (msg) => { alert(msg); this.refreshUsers(); },
      error: (e) => alert('Errore durante la promozione: ' + (e.error ?? e.message)),
    });
  }
}
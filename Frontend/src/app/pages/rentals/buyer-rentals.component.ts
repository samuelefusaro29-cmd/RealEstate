import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth.service';
import { RentalContractResponse, RentalRequestResponse } from '../../core/models';

@Component({
    selector: 'app-buyer-rentals',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './buyer-rentals.component.html',
    styleUrls: ['./buyer-rentals.component.css'],
})
export class BuyerRentalsComponent implements OnInit {
    private svc     = inject(RentalService);
    private contact = inject(ContactService);
    private auth    = inject(AuthService);

    requests        = signal<RentalRequestResponse[]>([]);
    contracts       = signal<RentalContractResponse[]>([]);
    loading         = signal(true);
    tab             = signal<'requests' | 'contracts'>('requests');
    terminatingId   = signal<number | null>(null);
    terminateError  = signal<string | null>(null);
    rescissionSent  = signal<number | null>(null); // id contratto per cui l'email è stata inviata

    ngOnInit(): void {
        this.svc.getBuyerRequests().subscribe({ next: r => this.requests.set(r), error: () => {} });
        this.svc.getTenantContracts().subscribe({
            next: c => { this.contracts.set(c); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    requestRescission(contract: RentalContractResponse): void {
        const ok = confirm(
            `Stai per inviare una richiesta di rescissione anticipata per l'immobile #${contract.postId}.\n` +
            `Verrà inviata un'email al proprietario. Continuare?`
        );
        if (!ok) return;

        const user = this.auth.user();
        if (!user) return;

        this.terminatingId.set(contract.id);
        this.terminateError.set(null);

        this.contact.send({
            senderName:    user.name,
            senderSurname: user.surname,
            message: `Salve, sono l'affittuario dell'immobile #${contract.postId}, vorrei terminare anticipatamente questo contratto, mi ricontatti su quest'email per definire. Grazie della disponibilità.`,
            postId:    contract.postId,
            postTitle: `Contratto #${contract.id} — Immobile #${contract.postId}`,
        }).subscribe({
            next: () => {
                this.rescissionSent.set(contract.id);
                this.terminatingId.set(null);
            },
            error: () => {
                this.terminateError.set('Errore durante l\'invio della richiesta. Riprova.');
                this.terminatingId.set(null);
            },
        });
    }

    statusLabel(s: string): string {
        return ({ PENDING: 'In attesa', ACCEPTED: 'Accettata', REJECTED: 'Rifiutata',
            ACTIVE: 'Attivo', TERMINATED: 'Terminato' } as Record<string, string>)[s] ?? s;
    }

    statusClass(s: string): string {
        return ({ PENDING: 'badge-pending', ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected',
            ACTIVE: 'badge-active', TERMINATED: 'badge-terminated' } as Record<string, string>)[s] ?? '';
    }

    formatPrice(n: number): string {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    }
}
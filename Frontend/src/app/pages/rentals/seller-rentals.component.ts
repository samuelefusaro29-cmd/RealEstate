import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';
import { RentalContractResponse, RentalRequestResponse } from '../../core/models';

@Component({
    selector: 'app-seller-rentals',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './seller-rentals.component.html',
    styleUrls: ['./seller-rentals.component.css'],
})
export class SellerRentalsComponent implements OnInit {
    private svc = inject(RentalService);

    requests     = signal<RentalRequestResponse[]>([]);
    contracts    = signal<RentalContractResponse[]>([]);
    loading      = signal(true);
    tab          = signal<'requests' | 'contracts'>('requests');
    msg          = signal<string | null>(null);
    pendingCount = computed(() => this.requests().filter(r => r.status === 'PENDING').length);

    ngOnInit(): void {
        this.svc.getSellerRequests().subscribe({ next: r => this.requests.set(r), error: () => {} });
        this.svc.getLandlordContracts().subscribe({
            next: c => { this.contracts.set(c); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    accept(r: RentalRequestResponse): void {
        if (!confirm('Accettare questa richiesta? Verrà creato un contratto.')) return;
        this.svc.acceptRequest(r.id).subscribe({
            next: (contract) => {
                this.requests.update(list => list.map(x => x.id === r.id ? { ...x, status: 'ACCEPTED' as const } : x));
                this.contracts.update(list => [contract, ...list]);
                this.flash('Richiesta accettata. Contratto creato.');
            },
            error: () => this.flash('Errore durante l\'accettazione.'),
        });
    }

    reject(r: RentalRequestResponse): void {
        if (!confirm('Rifiutare questa richiesta?')) return;
        this.svc.rejectRequest(r.id).subscribe({
            next: () => {
                this.requests.update(list => list.map(x => x.id === r.id ? { ...x, status: 'REJECTED' as const } : x));
                this.flash('Richiesta rifiutata.');
            },
            error: () => this.flash('Errore durante il rifiuto.'),
        });
    }

    terminate(c: RentalContractResponse): void {
        if (!confirm('Terminare questo contratto?')) return;
        this.svc.terminateContract(c.id).subscribe({
            next: () => {
                this.contracts.update(list => list.map(x => x.id === c.id ? { ...x, status: 'TERMINATED' as const } : x));
                this.flash('Contratto terminato.');
            },
            error: () => this.flash('Errore durante la terminazione.'),
        });
    }

    private flash(m: string): void { this.msg.set(m); setTimeout(() => this.msg.set(null), 3500); }

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
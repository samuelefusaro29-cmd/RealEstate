import {
    Component, ElementRef, OnInit, OnDestroy,
    EventEmitter, Input, Output, signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RentalService } from '../../core/services/rental.service';
import { RentalRequestResponse } from '../../core/models';

@Component({
    selector: 'app-rental-request-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './rental-request-modal.component.html',
    styleUrls: ['./rental-request-modal.component.css'],
})
export class RentalRequestModalComponent implements OnInit, OnDestroy {
    @Input() postId!: number;
    @Output() closed    = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<RentalRequestResponse>();

    private svc = inject(RentalService);
    private el  = inject(ElementRef);

    message      = '';
    desiredStart = '';
    desiredEnd   = '';
    error        = signal<string | null>(null);
    loading      = signal(false);

    bookedPeriods: { start: string; end: string }[] = [];
    today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    ngOnInit(): void {
        document.body.appendChild(this.el.nativeElement);
        // Carica i periodi occupati all'apertura del modale
        this.svc.getBookedPeriods(this.postId).subscribe({
            next: (periods) => this.bookedPeriods = periods,
            error: () => {} // silenzioso: non blocca l'apertura del modale
        });
    }

    ngOnDestroy(): void {
        if (this.el.nativeElement.parentElement === document.body) {
            document.body.removeChild(this.el.nativeElement);
        }
    }

    private overlapsBookedPeriod(start: string, end: string): boolean {
        const s = new Date(start);
        const e = new Date(end);
        return this.bookedPeriods.some(p => {
            const ps = new Date(p.start);
            const pe = new Date(p.end);
            // Sovrapposizione: s < pe && e > ps
            return s < pe && e > ps;
        });
    }

    submit(): void {
        if (!this.desiredStart || !this.desiredEnd) {
            this.error.set('Inserisci le date desiderate.');
            return;
        }
        if (new Date(this.desiredEnd) <= new Date(this.desiredStart)) {
            this.error.set('La data di fine deve essere successiva alla data di inizio.');
            return;
        }

        if (this.overlapsBookedPeriod(this.desiredStart, this.desiredEnd)) {
            this.error.set('Le date selezionate si sovrappongono con un contratto già attivo.');
            return;
        }
        this.loading.set(true);
        this.svc.createRequest({
            postId: this.postId,
            message: this.message,
            desiredStart: this.desiredStart,
            desiredEnd: this.desiredEnd,
        }).subscribe({
            next: (r) => { this.loading.set(false); this.submitted.emit(r); },
            error: (e) => {
                this.loading.set(false);
                this.error.set(e?.error?.message ?? 'Errore durante la richiesta.');
            },
        });
    }

    close(): void { this.closed.emit(); }
}
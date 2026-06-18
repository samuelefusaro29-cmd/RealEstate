import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertyService } from '../../core/services/property.service';
import { ReviewService } from '../../core/services/review.service';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth.service';
import { AuctionService, AuctionDto, BidDto } from '../../core/services/auction.service';
import { Property, Review, CATEGORY_LABELS, LISTING_TYPE_LABELS } from '../../core/models';
import { environment } from '../../../environments/environment';
import { RentalRequestModalComponent } from '../rentals/rental-request-modal.component';

interface SellerInfo { name: string; surname: string; email: string; }

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RentalRequestModalComponent],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css'],
})
export class PropertyDetailComponent implements OnInit {
  private svc        = inject(PropertyService);
  private revSvc     = inject(ReviewService);
  private contactSvc = inject(ContactService);
  private auc        = inject(AuctionService);
  private http       = inject(HttpClient);
  private route      = inject(ActivatedRoute);
  private sanitizer  = inject(DomSanitizer);
  protected authSvc  = inject(AuthService);

  property     = signal<Property | null>(null);
  reviews      = signal<Review[]>([]);
  loading      = signal(true);
  seller       = signal<SellerInfo | null>(null);
  auction      = signal<AuctionDto | null>(null);
  placeholder  = 'https://placehold.co/900x420/eee/999?text=hw26';
  currentPhoto = signal(0);

  showModal     = signal(false);
  contactMsg    = '';
  contactReason = 'info';
  contactReasons = [
    { value: 'info',   label: 'Voglio ulteriori informazioni', icon: 'bi-info-circle' },
    { value: 'photos', label: 'Voglio ulteriori foto',         icon: 'bi-images'      },
    { value: 'visit',  label: 'Voglio visitare l\'immobile',   icon: 'bi-house-door'  },
    { value: 'other',  label: 'Altro',                         icon: 'bi-chat-dots'   },
  ];
  contactSent  = signal(false);
  contactError = signal<string | null>(null);
  sending      = signal(false);

  showReviewForm      = signal(false);
  reviewAlreadyExists = signal(false);
  newTitle            = signal<string>('');
  newRating           = signal<number>(5);
  newComment          = signal<string>('');
  reviewError         = signal<string | null>(null);
  savingReview        = signal(false);
  editTitle           = signal<string>('');
  editingReviewId     = signal<number | null>(null);
  editRating          = signal<number>(5);
  editComment         = signal<string>('');

  showBidModal = signal(false);
  bidAmount    = signal<number | null>(null);
  bidError     = signal<string | null>(null);
  bidSending   = signal(false);
  bidSuccess   = signal(false);

  showBidHistory  = signal(false);
  showRentalModal = signal(false);
  rentalRequestSent = signal(false);
  bids            = signal<BidDto[]>([]);
  bidsLoading     = signal(false);

  buyerIsWinning = signal(false);

  private postId = 0;

  catLabel = () => { const p = this.property(); return p ? p.categoryLabel : ''; };
  listingLabel = () => { const p = this.property(); return p ? LISTING_TYPE_LABELS[p.listingType] : ''; };

  get mapsPreviewUrl(): SafeResourceUrl {
    const p = this.property();
    if (!p?.latitude || !p?.longitude) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${p.latitude},${p.longitude}&z=16&output=embed`
    );
  }

  openMaps(): void {
    const p = this.property();
    if (!p?.latitude || !p?.longitude) return;
    window.open(`https://www.google.com/maps?q=${p.latitude},${p.longitude}`, '_blank', 'noopener,noreferrer');
  }

  private updateWinningFlag(a: AuctionDto | null): void {
    const user = this.authSvc.user();
    this.buyerIsWinning.set(
        !!a && !a.closed && !!user && a.currentWinnerId === user.id
    );
  }

  ngOnInit(): void {
    this.postId = Number(this.route.snapshot.paramMap.get('id'));

    this.svc.get(this.postId).subscribe({
      next: (p) => {
        this.property.set(p);
        this.loading.set(false);
        this.http.get<any>(`${environment.apiUrl}/seller/${p.sellerId}`).subscribe({
          next: (s) => this.seller.set({ name: s.name, surname: s.surname, email: s.email }),
          error: ()  => this.seller.set(null),
        });
        this.loadAuction();
      },
      error: () => { this.property.set(null); this.loading.set(false); },
    });

    this.revSvc.list(this.postId).subscribe({ next: (r) => this.reviews.set(r) });
  }

  private loadAuction(): void {
    this.auc.getByPostId(this.postId).subscribe({
      next: (a) => {
        if (!a.closed) {
          this.auction.set(a);
          this.updateWinningFlag(a);
        }
      },
      error: () => {},
    });
  }

  formatPrice(n: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  get minBid(): number {
    const a = this.auction();
    return a ? a.currentBest + 2000 : 0;
  }

  formatEndDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatBidDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  openBidModal(): void {
    this.bidAmount.set(this.minBid);
    this.bidError.set(null);
    this.bidSuccess.set(false);
    this.showBidModal.set(true);
  }

  closeBidModal(): void { this.showBidModal.set(false); }

  submitBid(): void {
    const a      = this.auction();
    const amount = this.bidAmount();
    if (!a || amount === null) return;

    if (amount < this.minBid) {
      this.bidError.set(`L'offerta deve essere almeno ${this.formatPrice(this.minBid)} (offerta attuale + €2.000).`);
      return;
    }

    this.bidSending.set(true);
    this.bidError.set(null);

    this.auc.placeBid(a.id, amount).subscribe({
      next: () => {
        this.auc.getByPostId(this.postId).subscribe({
          next: (fresh) => {
            this.auction.set(fresh);
            this.updateWinningFlag(fresh);
            this.bidSending.set(false);
            this.bidSuccess.set(true);
            setTimeout(() => this.showBidModal.set(false), 1500);
          },
          error: () => {
            this.bidSending.set(false);
            this.bidSuccess.set(true);
            setTimeout(() => this.showBidModal.set(false), 1500);
          },
        });
      },
      error: (err) => {
        this.bidError.set(err?.error?.message ?? 'Errore durante l\'offerta. Riprova.');
        this.bidSending.set(false);
      },
    });
  }

  openBidHistory(): void {
    const a = this.auction();
    if (!a) return;
    this.bids.set([]);
    this.bidsLoading.set(true);
    this.showBidHistory.set(true);
    this.auc.getBids(a.id).subscribe({
      next: (list) => {
        const sorted = [...list].sort((x, y) => new Date(y.placedAt).getTime() - new Date(x.placedAt).getTime());
        this.bids.set(sorted);
        this.bidsLoading.set(false);
      },
      error: () => { this.bids.set([]); this.bidsLoading.set(false); },
    });
  }

  closeBidHistory(): void { this.showBidHistory.set(false); }

  openModal(): void {
    this.showModal.set(true);
    this.contactMsg    = '';
    this.contactReason = 'info';
    this.contactSent.set(false);
    this.contactError.set(null);
  }

  closeModal(): void { this.showModal.set(false); }

  prevPhoto(): void {
    const photos = this.property()?.photos ?? [];
    this.currentPhoto.update(i => (i - 1 + photos.length) % photos.length);
  }

  nextPhoto(): void {
    const photos = this.property()?.photos ?? [];
    this.currentPhoto.update(i => (i + 1) % photos.length);
  }

  goToPhoto(index: number): void { this.currentPhoto.set(index); }

  sendContact(): void {
    const user = this.authSvc.user();
    const p    = this.property();
    if (!user || !p) return;
    this.sending.set(true);
    this.contactError.set(null);
    const reasonLabel = this.contactReasons.find(r => r.value === this.contactReason)?.label ?? '';
    this.contactSvc.send({
      senderName: user.name, senderSurname: user.surname,
      message: `[${reasonLabel}]\n\n${this.contactMsg}`,
      postId: p.id, postTitle: p.title,
    }).subscribe({
      next:  () => { this.contactSent.set(true); this.sending.set(false); },
      error: (err) => { this.contactError.set(err?.error ?? 'Errore durante l\'invio.'); this.sending.set(false); },
    });
  }

  myExistingReview(): Review | undefined {
    const user = this.authSvc.user();
    if (!user) return undefined;
    return this.reviews().find(r => r.userId === user.id);
  }

  openReviewForm(): void {
    if (this.myExistingReview()) {
      this.reviewAlreadyExists.set(true);
      return;
    }
    this.reviewAlreadyExists.set(false);
    this.showReviewForm.set(true);
    this.newTitle.set(''); this.newRating.set(5); this.newComment.set(''); this.reviewError.set(null);
  }

  closeReviewForm(): void {
    this.showReviewForm.set(false);
    this.reviewAlreadyExists.set(false);
  }

  goToEditMyReview(): void {
    const existing = this.myExistingReview();
    if (!existing) return;
    this.reviewAlreadyExists.set(false);
    this.startEdit(existing);
  }

  submitReview(): void {
    const user = this.authSvc.user();
    const p    = this.property();
    if (!user || !p) return;
    this.savingReview.set(true);
    this.reviewError.set(null);
    this.revSvc.create({
      postId: p.id, userId: user.id, author: `${user.name} ${user.surname}`,
      title: this.newTitle(), rating: this.newRating(), description: this.newComment(),
    }).subscribe({
      next: (r) => { this.reviews.update(list => [r, ...list]); this.savingReview.set(false); this.showReviewForm.set(false); },
      error: (err) => { this.reviewError.set(err?.error ?? 'Errore durante il salvataggio.'); this.savingReview.set(false); },
    });
  }

  isReviewAuthor(review: Review): boolean {
    const user = this.authSvc.user();
    return !!user && user.id === review.userId;
  }

  canManageReview(r: Review): boolean {
    return this.isReviewAuthor(r) || this.authSvc.hasRole('ADMIN');
  }

  startEdit(review: Review): void {
    this.editingReviewId.set(review.id);
    this.editRating.set(review.rating);
    this.editComment.set(review.description);
    this.editTitle.set(review.title);
  }

  cancelEdit(): void { this.editingReviewId.set(null); }

  saveEdit(review: Review): void {
    const updated: Review = { ...review, rating: this.editRating(), title: this.editTitle(), description: this.editComment() };
    this.revSvc.update(updated).subscribe({
      next: (r) => { this.reviews.update(list => list.map(x => x.id === r.id ? r : x)); this.editingReviewId.set(null); },
      error: (err) => console.error('Errore aggiornamento recensione', err),
    });
  }

  deleteReview(review: Review): void {
    const ok = confirm('Vuoi eliminare questa recensione?');
    if (!ok) return;
    this.revSvc.delete(review.id).subscribe({
      next: () => {
        this.reviews.update(list => list.filter(r => r.id !== review.id));
        if (this.editingReviewId() === review.id) this.editingReviewId.set(null);
      },
      error: (err) => console.error('Errore eliminazione recensione', err),
    });
  }
}
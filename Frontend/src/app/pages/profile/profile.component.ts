import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, ProfileDto } from '../../core/services/profile.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
    private profileSvc = inject(ProfileService);
    private router     = inject(Router);
    private http       = inject(HttpClient);
    protected authSvc  = inject(AuthService);

    profile      = signal<ProfileDto | null>(null);
    loading      = signal(true);
    activeTab    = signal<'info' | 'password' | 'danger'>('info');

    editName       = signal('');
    editSurname    = signal('');
    editEmail      = signal('');
    editBirthDate  = signal('');
    emailOriginale = '';
    savingInfo     = signal(false);
    infoSuccess    = signal<string | null>(null);
    infoError      = signal<string | null>(null);

    otpEmailSent = signal(false);
    otpEmail     = '';
    otpEmailMsg  = signal<string | null>(null);

    oldPassword  = signal('');
    newPassword  = signal('');
    newPassword2 = signal('');
    savingPwd    = signal(false);
    pwdSuccess   = signal<string | null>(null);
    pwdError     = signal<string | null>(null);

    showOldPassword  = signal(false);
    showNewPassword  = signal(false);
    showNewPassword2 = signal(false);

    confirmDelete = signal(false);
    deleting      = signal(false);
    deleteError   = signal<string | null>(null);

    private infoTimer: ReturnType<typeof setTimeout> | null = null;
    private pwdTimer: ReturnType<typeof setTimeout> | null = null;
    private logoutTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        this.profileSvc.get().subscribe({
            next: (p) => {
                this.profile.set(p);
                this.editName.set(p.name);
                this.editSurname.set(p.surname);
                this.editEmail.set(p.email);
                this.emailOriginale = p.email;
                this.editBirthDate.set(p.birthDate ?? '');
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    isOAuth(): boolean {
        const p = this.profile();
        return !!p?.authProvider && p.authProvider !== 'LOCAL';
    }

    emailCambiata(): boolean {
        return this.editEmail() !== this.emailOriginale;
    }

    saveInfo(): void {
        if (this.isOAuth()) return;

        if (this.emailCambiata()) {
            if (!this.otpEmailSent()) {
                this.richiestaOtpEmail();
                return;
            }
            if (!this.otpEmail) {
                this.otpEmailMsg.set('Inserisci il codice OTP ricevuto.');
                return;
            }
            this.confermaOtpEmail();
            return;
        }

        this.eseguiSalvataggio();
    }

    private richiestaOtpEmail(): void {
        this.otpEmailMsg.set(null);
        this.http.post(
            `${environment.apiUrl}/user/me/email/request-otp`,
            { newEmail: this.editEmail() },
            { responseType: 'text' }
        ).subscribe({
            next: () => this.otpEmailSent.set(true),
            error: (e) => this.otpEmailMsg.set(e?.error ?? 'Errore invio OTP.'),
        });
    }

    private confermaOtpEmail(): void {
        this.otpEmailMsg.set(null);
        this.infoError.set(null);
        this.clearInfoTimer();
        this.clearLogoutTimer();

        this.http.post(
            `${environment.apiUrl}/user/me/email/confirm`,
            {
                newEmail: this.editEmail(),
                otp: this.otpEmail,
                name: this.editName(),
                surname: this.editSurname(),
                birthDate: this.editBirthDate(),
            },
            { responseType: 'text' }
        ).subscribe({
            next: () => {
                this.infoSuccess.set('Profilo aggiornato! Verrai disconnesso a breve.');
                this.infoTimer = setTimeout(() => {
                    this.infoSuccess.set(null);
                }, 2000);
                this.logoutTimer = setTimeout(() => {
                    this.authSvc.logout();
                }, 2000);
            },
            error: (e) => this.otpEmailMsg.set(e?.error ?? 'OTP non valido o scaduto.'),
        });
    }

    private eseguiSalvataggio(): void {
        this.savingInfo.set(true);
        this.infoSuccess.set(null);
        this.infoError.set(null);
        this.clearInfoTimer();

        this.profileSvc.update({
            name: this.editName(),
            surname: this.editSurname(),
            email: this.emailOriginale,
            birthDate: this.editBirthDate()
                ? this.editBirthDate() + 'T12:00:00'
                : null,
        }).subscribe({
            next: (msg) => {
                this.infoSuccess.set(msg);
                this.savingInfo.set(false);
                this.profile.update(p => p ? {
                    ...p,
                    name: this.editName(),
                    surname: this.editSurname(),
                    birthDate: this.editBirthDate() || null,
                } : p);
                this.authSvc.updateUser({
                    name: this.editName(),
                    surname: this.editSurname(),
                });
                this.infoTimer = setTimeout(() => {
                    this.infoSuccess.set(null);
                }, 2000);
            },
            error: (err) => {
                this.infoError.set(err?.error ?? 'Errore durante il salvataggio.');
                this.savingInfo.set(false);
            },
        });
    }

    savePassword(): void {
        if (this.newPassword() !== this.newPassword2()) {
            this.pwdError.set('Le due password non coincidono.');
            return;
        }

        if (this.newPassword().length < 6) {
            this.pwdError.set('La nuova password deve avere almeno 6 caratteri.');
            return;
        }

        this.savingPwd.set(true);
        this.pwdSuccess.set(null);
        this.pwdError.set(null);
        this.clearPwdTimer();

        this.profileSvc.changePassword(this.oldPassword(), this.newPassword()).subscribe({
            next: (msg) => {
                this.pwdSuccess.set(msg);
                this.savingPwd.set(false);
                this.oldPassword.set('');
                this.newPassword.set('');
                this.newPassword2.set('');
                this.showOldPassword.set(false);
                this.showNewPassword.set(false);
                this.showNewPassword2.set(false);
                this.pwdTimer = setTimeout(() => {
                    this.pwdSuccess.set(null);
                }, 2000);
            },
            error: (err) => {
                this.pwdError.set(err?.error ?? 'Errore durante il cambio password.');
                this.savingPwd.set(false);
            },
        });
    }

    deleteAccount(): void {
        this.deleting.set(true);
        this.deleteError.set(null);

        this.profileSvc.deleteAccount().subscribe({
            next: () => {
                this.authSvc.logout();
                this.router.navigate(['/']);
            },
            error: (err) => {
                let msg = 'Errore durante l\'eliminazione.';
                try {
                    const parsed = JSON.parse(err.error);
                    msg = parsed.message ?? msg;
                } catch {
                    if (typeof err.error === 'string' && err.error.includes('affitto'))
                        msg = err.error;
                }
                this.deleteError.set(msg);
                this.deleting.set(false);
            }
        });
    }

    ngOnDestroy(): void {
        this.clearInfoTimer();
        this.clearPwdTimer();
        this.clearLogoutTimer();
    }

    private clearInfoTimer(): void {
        if (this.infoTimer) {
            clearTimeout(this.infoTimer);
            this.infoTimer = null;
        }
    }

    private clearPwdTimer(): void {
        if (this.pwdTimer) {
            clearTimeout(this.pwdTimer);
            this.pwdTimer = null;
        }
    }

    private clearLogoutTimer(): void {
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
            this.logoutTimer = null;
        }
    }
}
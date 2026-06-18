import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  protected name            = '';
  protected surname         = '';
  protected email           = '';
  protected password        = '';
  protected confirmPassword = '';
  protected otp             = '';
  protected birthDate       = '';
  protected role            = 'BUYER';
  protected vatNumber       = '';

  protected showPassword  = signal(false);
  protected showConfirm   = signal(false);
  protected errors        = signal<string[]>([]);
  protected success       = signal(false);
  protected loading       = signal(false);
  protected otpSent       = signal(false);
  protected otpLoading    = signal(false);
  protected otpMsg        = signal<string | null>(null);

  get nameError(): string | null {
    if (this.name && this.name.trim().length < 3) return 'Il nome deve avere almeno 3 caratteri.';
    return null;
  }

  get surnameError(): string | null {
    if (this.surname && this.surname.trim().length < 3) return 'Il cognome deve avere almeno 3 caratteri.';
    return null;
  }

  get passwordError(): string | null {
    const p = this.password;
    if (!p) return null;
    if (p.length < 8)             return 'La password deve avere almeno 8 caratteri.';
    if (!/[A-Z]/.test(p))         return 'La password deve contenere almeno una lettera maiuscola.';
    if (!/[a-z]/.test(p))         return 'La password deve contenere almeno una lettera minuscola.';
    if (!/[0-9]/.test(p))         return 'La password deve contenere almeno un numero.';
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\/\[\]+=~`';]/.test(p))
      return 'La password deve contenere almeno un carattere speciale (es. ! @ # $).';
    return null;
  }

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  get ageError(): string | null {
    if (!this.birthDate) return null;
    const birth = new Date(this.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear()
        - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) return 'Devi avere almeno 18 anni per registrarti.';
    return null;
  }

  get maxDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  get formInvalid(): boolean {
    return !this.name || !this.surname || !this.email || !this.password ||
        !this.confirmPassword || !this.birthDate || !this.otp ||
        !!this.nameError || !!this.surnameError ||
        !!this.passwordError || this.passwordMismatch || !!this.ageError ||
        (this.role === 'SELLER' && !this.vatNumber);
  }

  requestOtp(): void {
    if (!this.email) { this.errors.set(['Inserisci l\'email prima di richiedere l\'OTP.']); return; }
    this.otpLoading.set(true);
    this.otpMsg.set(null);
    this.auth.requestRegistrationOtp(this.email).subscribe({
      next: () => {
        this.otpSent.set(true);
        this.otpMsg.set('OTP inviato! Controlla la tua email.');
        this.otpLoading.set(false);
      },
      error: (e) => {
        this.otpMsg.set(typeof e?.error === 'string' ? e.error : 'Errore invio OTP.');
        this.otpLoading.set(false);
      },
    });
  }

  submit(): void {
    this.errors.set([]);
    const errs: string[] = [];
    if (this.nameError)        errs.push(this.nameError);
    if (this.surnameError)     errs.push(this.surnameError);
    if (this.passwordError)    errs.push(this.passwordError);
    if (this.passwordMismatch) errs.push('Le password non coincidono.');
    if (this.ageError)         errs.push(this.ageError);
    if (!this.otp)             errs.push('Inserisci il codice OTP ricevuto via email.');
    if (errs.length) { this.errors.set(errs); return; }

    this.loading.set(true);
    const payload: Record<string, unknown> = {
      name: this.name, surname: this.surname, email: this.email,
      password: this.password, birthDate: this.birthDate,
      role: this.role, otp: this.otp,
    };
    if (this.role === 'SELLER') payload['vatNumber'] = this.vatNumber;

    this.auth.register(payload as any).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: (e) => {
        let msgs: string[];
        if (e?.error?.errors)                                     msgs = e.error.errors;
        else if (typeof e?.error === 'string' && e.error.trim()) msgs = [e.error];
        else if (e?.error?.message)                               msgs = [e.error.message];
        else                                                      msgs = ['Errore di registrazione.'];
        this.errors.set(msgs);
        this.loading.set(false);
      },
    });
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}
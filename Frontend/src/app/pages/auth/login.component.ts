import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showPassword = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (user) => {
        this.loading.set(false);

        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
          return;
        }

        if (user.role === 'SELLER') {
          this.router.navigate(['/seller']);
          return;
        }

        this.router.navigate(['/']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? e?.error ?? 'Credenziali non valide.');
      }
    });
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}
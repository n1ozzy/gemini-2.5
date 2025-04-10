import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  email = signal('');
  password = signal('');
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  async onSubmit() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.register(this.email(), this.password());
      console.log('[RegisterComponent] Rejestracja udana, przekierowanie...');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('[RegisterComponent] Błąd rejestracji:', error);
      this.errorMessage.set(this.mapFirebaseError(error.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapFirebaseError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Nieprawidłowy format adresu e-mail.';
      case 'auth/email-already-in-use':
        return 'Ten adres e-mail jest już zajęty.';
      case 'auth/weak-password':
        return 'Hasło jest zbyt słabe (musi mieć co najmniej 6 znaków).';
      default:
        return 'Wystąpił nieznany błąd rejestracji. Spróbuj ponownie.';
    }
  }
}

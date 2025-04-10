import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
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
      await this.authService.login(this.email(), this.password());
      console.log('[LoginComponent] Logowanie udane, przekierowanie...');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('[LoginComponent] Błąd logowania:', error);
      this.errorMessage.set(this.mapFirebaseError(error.code));
      this.isLoading.set(false);
    }
  }

  private mapFirebaseError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Nieprawidłowy format adresu e-mail.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Nieprawidłowy adres e-mail lub hasło.';
      default:
        return 'Wystąpił nieznany błąd logowania. Spróbuj ponownie.';
    }
  }
}

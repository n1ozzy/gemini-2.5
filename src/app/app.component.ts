import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth.service';
import { User } from '@angular/fire/auth';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ParticleNetwork } from '@shared/animations/particleNetwork';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService: AuthService = inject(AuthService);
  private firestore: Firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  currentUser$: Observable<User | null> = this.authService.user$;
  testData$: Observable<any[]> | undefined;
  firestoreReadError: string | null = null;

  private firestoreSubscription: Subscription | undefined;
  private particleNetworkInstance: ParticleNetwork | null = null;

  constructor() {}

  ngOnInit(): void {
    console.log('[AppComponent] OnInit');
    this.firestoreSubscription = this.currentUser$
      .pipe(
        switchMap((user) => {
          if (user) {
            console.log(
              '[AppComponent] Użytkownik zalogowany, próba odczytu Firestore...'
            );
            this.firestoreReadError = null;
            const testCollection = collection(this.firestore, 'test');
            return collectionData(testCollection, { idField: 'id' });
          } else {
            console.log(
              '[AppComponent] Użytkownik niezalogowany, brak odczytu Firestore.'
            );
            this.firestoreReadError = null;
            return of(null);
          }
        })
      )
      .subscribe({
        next: (data) => {
          if (data !== null && Array.isArray(data)) {
            console.log('[AppComponent] Otrzymano dane z Firestore:', data);
            this.testData$ = of(data);
          } else if (data === null) {
            console.log(
              '[AppComponent] Brak danych Firestore (użytkownik niezalogowany lub kolekcja pusta).'
            );
            this.testData$ = undefined;
          } else {
            console.warn(
              '[AppComponent] Otrzymano nieoczekiwany format danych z Firestore:',
              data
            );
            this.testData$ = undefined;
          }
        },
        error: (err) => {
          console.error('[AppComponent] !!! Błąd odczytu Firestore:', err);
          this.firestoreReadError =
            err.message || 'Unknown Firestore read error';
          this.testData$ = undefined;
        },
      });
  }

  ngAfterViewInit(): void {
    console.log('[AppComponent] AfterViewInit');
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.particleNetworkInstance = new ParticleNetwork('particleCanvas');
        console.log('[AppComponent] ParticleNetwork initialized successfully.');
      } catch (error) {
        console.error(
          '[AppComponent] Failed to initialize ParticleNetwork:',
          error
        );
        const canvas = document.getElementById('particleCanvas');
        if (canvas) {
          canvas.style.display = 'none';
        }
      }
    } else {
      console.log(
        '[AppComponent] Skipping ParticleNetwork initialization (not in browser).'
      );
    }
  }

  ngOnDestroy(): void {
    this.firestoreSubscription?.unsubscribe();
    console.log('[AppComponent] OnDestroy - Unsubscribed from Firestore.');

    if (this.particleNetworkInstance) {
      this.particleNetworkInstance.destroy();
      this.particleNetworkInstance = null;
      console.log('[AppComponent] ParticleNetwork destroyed.');
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      console.log('[AppComponent] Logout successful.');
    } catch (error) {
      console.error('[AppComponent] Error during logout:', error);
    }
  }
}
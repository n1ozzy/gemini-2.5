import { Injectable, inject } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '@angular/fire/auth'; // Importuj potrzebne funkcje
import { Observable, BehaviorSubject } from 'rxjs'; // Importuj Observable i BehaviorSubject

@Injectable({
  providedIn: 'root' // Domyślnie dostępny w całej aplikacji
})
export class AuthService {
  private auth: Auth = inject(Auth); // Wstrzyknij Firebase Auth

  // BehaviorSubject przechowuje aktualny stan użytkownika i pozwala komponentom go subskrybować
  // Inicjujemy go jako null (brak użytkownika na początku)
  private userSubject = new BehaviorSubject<User | null>(null);
  // Publiczny Observable, aby komponenty mogły śledzić zmiany stanu użytkownika
  public user$ = this.userSubject.asObservable();
  // Flaga wskazująca, czy stan autentykacji został już zainicjowany
  private authStateInitialized = false;


  constructor() {
    // Nasłuchuj na zmiany stanu autentykacji z Firebase
    onAuthStateChanged(this.auth, (user) => {
      console.log('[AuthService] Stan Auth zmieniony, user:', user);
      this.userSubject.next(user); // Zaktualizuj BehaviorSubject nowym stanem użytkownika
      this.authStateInitialized = true; // Oznacz, że stan został zainicjowany
    });
  }

  // Metoda do logowania
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('[AuthService] Zalogowano pomyślnie:', userCredential.user);
      // userSubject zostanie zaktualizowany przez onAuthStateChanged
      return userCredential.user;
    } catch (error) {
      console.error('[AuthService] Błąd logowania:', error);
      throw error; // Przekaż błąd dalej, aby komponent mógł go obsłużyć
    }
  }

  // Metoda do rejestracji (dodamy później zapis do Firestore)
  async register(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('[AuthService] Zarejestrowano pomyślnie:', userCredential.user);
      // TODO: Zapisz dodatkowe dane użytkownika (np. rolę) w Firestore tutaj lub w komponencie
      // userSubject zostanie zaktualizowany przez onAuthStateChanged
      return userCredential.user;
    } catch (error) {
      console.error('[AuthService] Błąd rejestracji:', error);
      throw error; // Przekaż błąd dalej
    }
  }

  // Metoda do wylogowania
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('[AuthService] Wylogowano pomyślnie');
      // userSubject zostanie zaktualizowany przez onAuthStateChanged na null
    } catch (error) {
      console.error('[AuthService] Błąd wylogowywania:', error);
      throw error; // Przekaż błąd dalej
    }
  }

  // Metoda zwracająca aktualnego użytkownika (synchronicznie, jeśli już zainicjowano)
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // Metoda sprawdzająca, czy stan autentykacji został już określony
  isAuthStateInitialized(): boolean {
    return this.authStateInitialized;
  }
}
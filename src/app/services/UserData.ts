// user.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface UserData {
  id: number;
  tipoUsuario: string;
  nombre: string;
  colegio: number;
  jwt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public userData$ = this.userDataSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadUserFromStorage();
  }

  // Métodos faltantes que necesitas
  getUserName(): string {
    return this.userDataSubject.value?.nombre || '';
  }

  getUserType(): string {
    return this.userDataSubject.value?.tipoUsuario || '';
  }

  getJwtToken(): string {
    return this.userDataSubject.value?.jwt || '';
  }

  // Métodos existentes
  private loadUserFromStorage(): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const userData: UserData = JSON.parse(storedData);
          this.userDataSubject.next(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.clearUserData();
    }
  }

  clearUserData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userData');
    }
    this.userDataSubject.next(null);
  }

  setUserData(userData: UserData): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    this.userDataSubject.next(userData);
  }

  // Método adicional útil
  getUserData(): UserData | null {
    return this.userDataSubject.value;
  }
}
import { Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private userData: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  login(userData: any) {
    this.isAuthenticated = true;
    this.userData = userData;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    console.log(`Login exitoso para ${userData.userNumDoc} con rol ${userData.tipoUsuario}`);
  }

  logout() {
    this.isAuthenticated = false;
    this.userData = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userData');
    }
    console.log('Logout ejecutado, estado de autenticación limpiado');
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (storedAuth && !this.isAuthenticated) {
        this.isAuthenticated = true;
        this.userData = JSON.parse(localStorage.getItem('userData') || '{}');
      }
    }
    return this.isAuthenticated;
  }

  getUserData(): any {
    if (isPlatformBrowser(this.platformId) && !this.userData && localStorage.getItem('userData')) {
      this.userData = JSON.parse(localStorage.getItem('userData') || '{}');
    }
    return this.userData;
  }

  getUserRole(): string {
    return this.getUserData()?.tipoUsuario || '';
  }
}
import { Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';

// Interface corregida - colegio es un número (ID)
interface UserData {
 id: number;
  tipoUsuario: string;
  nombre: string;
  colegio: number; // Esto es un número (ID), no un objeto
  jwt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private userData: UserData | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  login(userData: UserData) {
    this.isAuthenticated = true;
    this.userData = userData;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    console.log(`Login exitoso para ${userData.nombre} con rol ${userData.tipoUsuario}`);
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
        this.userData = JSON.parse(
          localStorage.getItem('userData') || '{}'
        ) as UserData;
      }
    }
    return this.isAuthenticated;
  }

  getUserData(): UserData | null {
    if (
      isPlatformBrowser(this.platformId) &&
      !this.userData &&
      localStorage.getItem('userData')
    ) {
      this.userData = JSON.parse(
        localStorage.getItem('userData') || '{}'
      ) as UserData;
    }
    return this.userData;
  }

  getColegioId(): number {
    const userData = this.getUserData();
    return userData?.colegio || 0;
  }

  getUserRole(): string {
    return this.getUserData()?.tipoUsuario || '';
  }

  // Nuevo método para obtener el ID del colegio
  
}
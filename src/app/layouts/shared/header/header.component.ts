import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserData, UserService } from '../../../services/UserData';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string = '';
  userRole: string = '';
  private userSub!: Subscription;

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Suscripción a cambios en los datos del usuario
    this.userSub = this.userService.userData$.subscribe(user => {
      this.updateUserInfo(user);
    });

    // Cargar datos iniciales
    const currentUser = this.userService.getUserData();
    this.updateUserInfo(currentUser);
  }

  private updateUserInfo(user: UserData | null): void {
    this.userName = user?.nombre || '';
    this.userRole = this.translateRole(user?.tipoUsuario);
  }

  private translateRole(role?: string): string {
    switch(role) {
      case 'trabajador': return 'Trabajador';
      case 'admin': return 'Administrador';
      default: return '';
    }
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }
}
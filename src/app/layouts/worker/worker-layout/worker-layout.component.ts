import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './worker-layout.component.html',
  styleUrls: ['./worker-layout.component.css']
})
export class WorkerLayoutComponent {
  constructor(public authService: AuthService) {}
}
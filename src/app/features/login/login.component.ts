import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService, UserData } from '../../services/UserData';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/usuario/login';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;
      const loginData = {
        numeroDocumento: this.loginForm.value.username,
        contrasena: this.loginForm.value.password,
        valueToken: 'string',
      };

      this.http.post<any>(this.apiUrl, loginData).subscribe({
        next: (response) => {
          this.ngZone.run(() => {


            const userData: UserData = {
              id: response.id,
              tipoUsuario: response.tipoUsuario,
              nombre: response.nombre,
              colegio: response.colegio,
              jwt: response.jwt,
            };

            this.userService.setUserData(userData);
            this.authService.login(userData);
            this.loading = false;

            if (response.tipoUsuario === 'trabajador') {
              this.router.navigate(['/worker/alumnos']);
            } else if (response.tipoUsuario === 'admin') {
              this.router.navigate(['/admin/colegios']);
            } else {
              this.error = 'Tipo de usuario no reconocido';
            }

            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('Error en login:', error);
            this.loading = false;
            this.error =
              error.status === 401
                ? 'Credenciales Incorrectas'
                : 'Error al iniciar sesión';
            this.cdr.detectChanges();
          });
        },
      });
    } else {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
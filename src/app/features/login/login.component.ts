import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;
      const loginData = {
        numeroDocumento: this.loginForm.value.username,
        contrasena: this.loginForm.value.password,
        valueToken: 'string'
      };
      this.http.post<any>(this.apiUrl, loginData).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            console.log('Login exitoso:', response);
            this.authService.login(response);
            if (response.tipoUsuario === 'trabajador') {
              this.router.navigate(['/worker/alumnos']);
            } else {
              console.log('Tipo de usuario no soportado:', response.tipoUsuario);
            }
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('Error en login:', error);
            if (error.status === 401) {
              this.error = 'Credenciales Incorrectas';
            } else {
              this.error = 'Error al iniciar sesión';
            }
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      console.log('Formulario inválido:', this.loginForm.errors);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
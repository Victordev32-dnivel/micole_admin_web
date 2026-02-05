import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Appsistencia';

  constructor(
    private router: Router,
    private location: Location
  ) { }

  @HostListener('document:backbutton', ['$event'])
  onBackButton(event: Event) {
    console.log('🔙 Back button detected. Current URL:', this.router.url);

    // Rutas donde DEBE salir de la app (Home, Perfil, Calendario)
    // Se asume que /worker/alumnos es el Home para workers, y /admin/colegios para admins.
    // Se agregan rutas probables para perfil y calendario.
    const rootPaths = [
      '/login',
      '/worker/alumnos',
      '/admin/colegios',
      '/worker/perfil',
      '/perfil',
      '/worker/calendario',
      '/calendario',
      '/worker/periodos' // A veces se usa como calendario
    ];

    const currentUrl = this.router.url;

    // Verificamos si estamos en una ruta raíz
    const isRoot = rootPaths.some(path => currentUrl.includes(path));

    if (isRoot) {
      console.log('🏠 Estamos en ruta raíz. Dejando acción por defecto (Salir).');
      // No prevenimos el default, dejamos que el sistema (Cordova/Capacitor) maneje el salir
    } else {
      console.log('🔄 No es ruta raíz. Navegando atrás.');
      event.preventDefault(); // Evita el popup de "Desea salir"
      this.location.back();
    }
  }
}

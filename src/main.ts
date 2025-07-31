import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Polyfill para global en el navegador
if (typeof global === 'undefined') {
  (window as any).global = window;
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

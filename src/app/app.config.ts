import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppRouteReuseStrategy } from './app.route-reuse-strategy';
import { RouteReuseStrategy } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy}
  ]
};

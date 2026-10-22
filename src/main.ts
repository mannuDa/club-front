import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppModule } from './app/app';
import { routes } from './app/app.routes';
import { provideToastr } from 'ngx-toastr';
bootstrapApplication(AppModule, {
  providers: [
    provideRouter(routes),
    provideToastr()
  ]
}).catch(err => console.error(err));
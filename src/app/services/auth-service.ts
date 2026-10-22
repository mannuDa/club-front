import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpServiceService } from './http-service.service';

export const RoleAuthGuard: CanActivateFn = (route, state) => {
  const httpService = inject(HttpServiceService);
  const router = inject(Router);

  const token = localStorage.getItem('authToken');
  const isAuthenticated = !!token || httpService.isAuthenticated();

  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', state.url)
    if (state.url.startsWith('/admin')) {
      return router.createUrlTree(['/admin-login']); // Admin ke liye
    } else {
      return router.createUrlTree(['/login']);        // Normal user ke liye
    }
  }

  // Baaki role checking ka code waise hi rahega...
  const userRole = httpService.getUserRole();
  const expectedRoles = route.data['role'] as Array<string>;

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (expectedRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
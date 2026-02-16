import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user && (user.role === 'owner' || user.role === 'admin')) {
    return true;
  }
  return router.createUrlTree(['/tasks']);
};

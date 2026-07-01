import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { Auth } from '../../features/auth/services/auth';
import { TokenService } from '../services/token';
import { SessionExtendDialogComponent } from '../../features/users/models/session-extend-dialog/session-extend-dialog';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const tokenService = inject(TokenService);
  const dialog = inject(MatDialog);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if backend rejected request with our custom 401 Unauthorized block
      if (error.status === 401) {
        const refreshToken = tokenService.getRefreshToken();
        
        if (!refreshToken) {
          authService.logout();
          return throwError(() => error);
        }

        // Open Angular Material dialog confirmation
        return dialog.open(SessionExtendDialogComponent, { width: '400px', disableClose: true })
          .afterClosed()
          .pipe(
            switchMap((shouldExtend: boolean) => {
              if (shouldExtend) {
                // Execute backend refresh 
                return authService.refreshAccessToken(refreshToken).pipe(
                  switchMap((res: any) => {
                    tokenService.saveTokens(res.username, res.accessToken, res.refreshToken);
                    
                    // Retry original failed HTTP request with brand new token
                    const clonedReq = req.clone({
                      setHeaders: { Authorization: `Bearer ${res.accessToken}` }
                    });
                    return next(clonedReq);
                  }),
                  catchError((refreshErr) => {
                    authService.logout();
                    return throwError(() => refreshErr);
                  })
                );
              } else {
                authService.logout();
                return of(null as any);
              }
            })
          );
      }
      return throwError(() => error);
    })
  );
};
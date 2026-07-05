import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token';

export const jwtExpiredInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: any) => {
            if (error instanceof HttpErrorResponse) {
                if (error.status === 401) {
                    console.warn('JWT token expired or unauthorized request. Logging out automatically...');
                    tokenService.clearTokens();
                    router.navigate(['/login'], {
                        queryParams: { reason: 'jwt_token_expired' }
                    });
                }
            }
            return throwError(() => error);
        })
    );
};
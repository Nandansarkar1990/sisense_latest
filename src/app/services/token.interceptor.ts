import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { LoginService } from './login.service';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
    constructor(public loginService: LoginService) { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (request.url.includes("authentication/login")) {
            return next.handle(request)
        }

        return this.loginService.getAuthToken().pipe(
            mergeMap((data: any) => {
                const token = (data as any).access_token;
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });

                return next.handle(request);
            })
        )

    }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  token = null;
  logedin = false;
  baseUrl = 'http://localhost:8081'
  constructor(private http: HttpClient) { }


  getAuthToken(): Observable<any> {
    if (!this.token) {
      console.log('[token not found]')
      return this.http.post('http://localhost:8081/api/v1/authentication/login', { username: 'nandansarkar@yopmail.com', password: '9774159349@Na' })
    } else {
      console.log('[token already present]')
      of({
        access_token: this.token
      })
    }
  }

  getprofile(token) {
    let header = new HttpHeaders();
    header.append('Authorization', 'Bearer ' + token);

  }

  isLogedIn() {
    this.logedin = true;
    // return this.logedin;
  }
}

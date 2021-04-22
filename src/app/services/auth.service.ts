import {Injectable} from '@angular/core';
import {HTTP} from '@ionic-native/http/ngx';
import {environment} from '../../environments/environment';
import jwt_decode from 'jwt-decode';
import {IUser, UserStoreService} from './user-store.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HTTP,
              private userStoreService: UserStoreService) {
  }
}

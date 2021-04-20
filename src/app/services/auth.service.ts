import {Injectable} from '@angular/core';
import {HTTP} from '@ionic-native/http/ngx';
import {environment} from '../../environments/environment';
import {BehaviorSubject} from 'rxjs';
import jwt_decode from 'jwt-decode';
import {File} from '@ionic-native/file/ngx';
import {ConfigOdb} from './config-odb.service';


export interface IAuthUser {
  subject: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  nameFile = 'UserStore.json';
  authUser$: BehaviorSubject<IAuthUser> = new BehaviorSubject<IAuthUser>(null);
  authUser = this.authUser$.asObservable();

  constructor(private http: HTTP, private file: File) {}

  async init() {
    const data = await this.read();
    if (typeof data === 'string' && data.length > 0){
      try {
        const dt = JSON.parse(data);
        this.authUser$.next(dt);
      }catch (e) {
        this.authUser$.next(null);
      }
    }else{
      this.authUser$.next(null);
    }
  }

  login(username: string, password: string) {
    return new Promise(async (resolve, reject) => {
      const url = environment.identityUrl + '/connect/token';
      const headers = {
        'Content-Type': 'application/json'
      };

      try {
        await this.http.setServerTrustMode('nocheck');
        const response = await this.http.post(
          url,
          {
            client_id: 'odbApp',
            grant_type: 'password',
            scope: 'openid odbAppApi offline_access',
            username,
            password
          },
          headers);
        const data = JSON.parse(response.data);
        const dataFromJwt: any = jwt_decode(data.access_token);
        this.authUser$.next({
          subject: dataFromJwt.sub,
          name: dataFromJwt.name,
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        });
        this.save();
        resolve(response.data);
      } catch (err) {
        console.log('[INFO] HTTP Error: ' + JSON.stringify(err));
        this.save('');
        reject(JSON.parse(err.error));
      }
    });
  }

  getNewAccessToken(refreshToken: string) {
    return new Promise(async (resolve, reject) => {
      const url = environment.identityUrl + '/connect/token';
      const headers = {
        'Content-Type': 'application/json'
      };

      try {
        await this.http.setServerTrustMode('nocheck');
        const response = await this.http.post(
          url,
          {
            client_id: 'odbApp',
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          },
          headers);
        resolve(response.data);
      } catch (err) {
        console.log('[INFO] HTTP Error: ' + JSON.stringify(err));
        reject(JSON.parse(err.error));
      }
    });
  }

  logout() {
    this.authUser$.next(null);
    this.save('');
  }

  async read() {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onloadend = function() {
          resolve(this.result);
        };
        reader.readAsText(file);
      }, (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  async save(user?: IAuthUser | string) {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.createWriter((fileWriter) => {
        fileWriter.write(  typeof user === 'string' ? user : JSON.stringify(this.authUser$.value));
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  }

  async accessToFile() {
    const dirEntry: any = await this.file.resolveLocalFilesystemUrl(this.file.dataDirectory);
    return await new Promise((resolve, reject) => {
      dirEntry.getFile(this.nameFile, {create: true, exclusive: false}, (fileEntry) => {
        resolve(fileEntry);
      }, (err) => {
        reject(err);
      });
    });
  }
}

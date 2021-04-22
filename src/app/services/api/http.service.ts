import {Injectable} from '@angular/core';
import {HTTP, HTTPResponse} from '@ionic-native/http/ngx';
import {defer, empty, from, Observable, of, throwError, timer} from 'rxjs';
import {catchError, concatMap, map, mergeMap, retryWhen, switchMap, take, tap} from 'rxjs/operators';
import {IUser, UserStoreService} from '../user-store.service';
import {environment} from '../../../environments/environment';
import jwt_decode from 'jwt-decode';
import {ToastController} from '@ionic/angular';


export class HttpSendOptions {
  responseType: 'text' | 'arraybuffer' | 'blob' | 'json' = 'json';
  headers: { [index: string]: string; } = {
    'Content-Type': 'application/json'
  };
  serializer: 'json' | 'urlencoded' | 'utf8' | 'multipart' = 'json';
  method: 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options' | 'upload' | 'download' = 'get';
  data: { [index: string]: any; } = {};

  setHeader(key: string, value: string) {
    this.headers[key] = value;
  }
}


@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HTTP,
              private userStoreService: UserStoreService,
              public toastController: ToastController) {
  }

  configureSend(url: string, options: HttpSendOptions, useToken: boolean = true): Observable<any> {
    return useToken
      ? this.userStoreService.user.pipe(
        concatMap((user) => {
          options.setHeader('Authorization', `Bearer ${user.accessToken}`);
          return from(this.http.sendRequest(url, options));
        })
      )
      : from(this.http.sendRequest(url, options));
  }


  send(url: string, options: HttpSendOptions, useToken: boolean = true): Observable<any> {
    return from(this.http.setServerTrustMode('nocheck')).pipe(
      switchMap(() =>
        this.configureSend(url, options, useToken).pipe(
          map((response: HTTPResponse) => response),
          retryWhen((errors) =>
            errors.pipe(
              tap((val) => console.log('[API ERROR] ' + JSON.stringify(val))),
              mergeMap((error, i) => useToken === true && error.status === 401 && i === 0
                ? this.authenticationRefresh().pipe(
                  tap(() => console.log('[API] Get refresh token ' + i))
                )
                : throwError(error)
              )
            )),
          catchError((error: HTTPResponse) =>
            throwError(JSON.parse(error.error))
          )
        ))
    );
  }

  authentication(username: string, password: string): Observable<any> {
    const url = environment.identityUrl + '/connect/token';
    const options = new HttpSendOptions();
    options.data = {
      client_id: 'odbApp',
      grant_type: 'password',
      scope: 'openid odbAppApi offline_access',
      username,
      password
    };
    options.method = 'post';
    options.serializer = 'urlencoded';
    return this.send(url, options, false)
      .pipe(
        switchMap((response: HTTPResponse) =>
          defer(() => {
            const obj: IUser = this.responseToUser(response);
            return from(this.userStoreService.update(obj));
          })),
        catchError((error) =>
          of(this.userStoreService.update(null)).pipe(
            switchMap(() => throwError(error))
          )
        )
      );
  }

  authenticationRefresh(): Observable<any> {
    const user = this.userStoreService.user$.getValue();
    const url = environment.identityUrl + '/connect/token';
    const options = new HttpSendOptions();
    options.data = {
      client_id: 'odbApp',
      grant_type: 'refresh_token',
      refresh_token: user?.refreshToken || ''
    };
    options.method = 'post';
    options.serializer = 'urlencoded';
    return this.send(url, options, false)
      .pipe(
        switchMap((response: HTTPResponse) =>
          defer(() => {
            const obj: IUser = this.responseToUser(response);
            return from(this.userStoreService.update(obj));
          })),
        catchError((error) =>
          of(this.userStoreService.update(null)).pipe(
            switchMap(() => defer(() => {
              if (error?.error === 'invalid_grant'){
                this.presentToast('Срок действия токенов истек. \nАвторизуйтесь снова');
              }
              return throwError(error);
            }))
          )
        )
      );
  }

  responseToUser(response: HTTPResponse): IUser {
    const dataFromJwt: any = jwt_decode(response.data.access_token);
    return {
      subject: dataFromJwt.sub,
      name: dataFromJwt.name,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    } as IUser;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000
    });
    await toast.present();
  }

  testApi(): Observable<any> {
    const url = environment.apiUrl + '/values';
    const options = new HttpSendOptions();
    return this.send(url, options).pipe(
      tap((val) => console.log('[TEST API] ' + JSON.stringify(val)))
    );
  }
}

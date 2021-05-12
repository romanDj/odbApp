import {Injectable} from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {HTTP, HTTPResponse} from '@ionic-native/http/ngx';
import {environment} from '../../environments/environment';
import {BehaviorSubject, empty, from, Observable, of, throwError} from 'rxjs';
import {UserStoreService} from './user-store.service';
import {HttpSendOptions, HttpService} from './api/http.service';
import {catchError, concatMap, finalize, switchMap, take, tap} from 'rxjs/operators';
import {ToastController} from '@ionic/angular';
import * as moment from 'moment';
import {ReceiveItemQ} from '../utils/queue';


@Injectable({
  providedIn: 'root'
})
export class LiveMetricsService {

  private database: SQLiteObject;

  private isLoadRows$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly isLoadRows = this.isLoadRows$.asObservable();

  private isSend$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly isSend = this.isSend$.asObservable();


  constructor(
    private sqlite: SQLite,
    private http: HTTP,
    private userStoreService: UserStoreService,
    private httpService: HttpService,
    public toastController: ToastController) {
  }

  init() {
    return new Promise((resolve, reject) => {
      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        db.executeSql(`CREATE TABLE IF NOT EXISTS liveMetric
                       (
                         rowid  INTEGER PRIMARY KEY,
                         ts     INTEGER,
                         name   text,
                         value  text,
                         tripId INTEGER,
                         isSend INTEGER
                       )`, [])
          .then(() => {
            console.log('[INFO] Executed CREATE TABLE IF NOT EXISTS liveMetric');
            this.clearOldData();
          }).catch((e) => console.log('ERR CREATING TABLE liveMetric ' + JSON.stringify(e)));
      }).catch(err => {
        console.log('[INFO]  ' + JSON.stringify(err));
        reject();
      }).finally(() => resolve());
    });
  }

  push(name: string, value: string, time: number) {
    return new Promise((resolve, reject) => {
      this.database.executeSql(
        'INSERT INTO liveMetric VALUES (?,?,?,?,?,?)',
        [null, time, name, value, 0, 0]).then(() => {
          resolve();
      }).catch((err) => {
        console.log('[ERROR] ' + err.message);
        resolve();
      });
    });
  }

  pushFromQueue(item: ReceiveItemQ){
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        item.items.forEach((val) => {
          tx.executeSql('INSERT INTO liveMetric VALUES (?,?,?,?,?,?)',
            [null, item.ts, val.name, val.value, 0, 0]);
        });
      }).then(() => {
        resolve();
      }).catch((err) => {
        console.log('[ERROR] ' + err.message);
        resolve();
      });
    });
  }

  getRows(query: string, params: Array<any> = []) {
    return new Promise((resolve, reject) => {
      this.database.transaction(tx => {
        tx.executeSql(query, params, (_, {rows}) => {
          console.log('[INFO] Records found to send: ' + rows.length);
          const data = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          resolve(data);
        }, (err) => {
          console.log('[ERR] ' + JSON.stringify(err));
        });
      });
    });
  }

  getHistory() {
    this.isLoadRows$.next(true);
    return this.getRows('SELECT  * FROM liveMetric ORDER BY ts DESC LIMIT 500').finally(() => {
      this.isLoadRows$.next(false);
    });
  }

  getRecordsNoSync() {
    return this.getRows('SELECT  * FROM liveMetric WHERE isSend=0 ORDER BY ts ASC LIMIT 1000;');
  }

  getRecordsNoSyncAll() {
    return this.getRows('SELECT  * FROM liveMetric WHERE isSend=0 ORDER BY ts ASC');
  }

  setIsSync(ids) {
    return new Promise((resolve, reject) => {
      this.database.executeSql(
        `UPDATE liveMetric SET isSend = 1 WHERE rowid IN (${ids.join(', ')})`,
        []).then(() => {
        resolve();
      }).catch((err) => {
        console.log('[ERROR] ' + err.message);
        reject();
      });
    });
  }

  sendData(): Observable<any> {
    return from(this.getRecordsNoSync())
      .pipe(
        switchMap((rows: any) => rows?.length > 0
          ? this.sendDataInServerObs(rows)
          : empty()
        ),
        catchError((error) => throwError(error))
      );
  }

  sendDataRecursion(): Observable<any> {
    this.isSend$.next(true);

    return from(this.getRecordsNoSyncAll())
      .pipe(
        switchMap((rows: any) => rows?.length > 0
          ? this.sendDataInServerObs(rows)
          : of(1)
        ),
        catchError((error) => {
          return throwError(error);
        }),
        finalize(() => this.isSend$.next(false))
      );
  }

  sendDataInServerObs(rows): Observable<any> {
    const url = environment.apiUrl + '/livemetrics';
    const options = new HttpSendOptions();
    const records = rows.map(({rowid, ts, name, value}) => ({rowid, ts, name, value}));
    options.data = {
      liveMetrics: records
    };
    options.method = 'post';
    return this.httpService.send(url, options)
      .pipe(
        tap((val) => console.log('[API SEND METRICS] ' + JSON.stringify(val))),
        switchMap((response: HTTPResponse) =>
          from(this.setIsSync(response.data))
        ),
        catchError((error) => {
          console.log('[API SEND METRICS] Error: ' + JSON.stringify(error));
          return throwError(error);
        })
      );
  }

  clearOldData() {
    return new Promise((resolve, reject) => {
      this.database.executeSql(
        `DELETE FROM liveMetric  WHERE isSend = 1 AND ts < ${moment().subtract(2, 'minutes').valueOf()}`,
        []).then(() => {
        console.log('[CLEAR OLD DATA] Success');
        resolve();
      }).catch((err) => {
        console.log('[CLEAR OLD DATA] ERROR ' + err.message);
        reject();
      });
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000
    });
    await toast.present();
  }

}

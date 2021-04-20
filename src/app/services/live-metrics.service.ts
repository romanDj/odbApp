import {Injectable} from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {environment} from '../../environments/environment';
import {BehaviorSubject} from 'rxjs';
import {AuthService} from './auth.service';


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
    private authService: AuthService) {
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
          }).catch((e) => console.log('ERR CREATING TABLE liveMetric ' + JSON.stringify(e)));
      }).catch(err => {
        console.log('[INFO]  ' + JSON.stringify(err));
        reject();
      }).finally(() => resolve());
    });
  }

  push(name: string, value: string, time: number) {
    return new Promise((response, reject) => {
      this.database.executeSql(
        'INSERT INTO liveMetric VALUES (?,?,?,?,?,?)',
        [null, time, name, value, 0, 0]).then(() => {

      }).catch((err) => console.log('[ERROR] ' + err.message));
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

  sendData() {
    return new Promise(async (resolve, reject) => {
      const records: any = await this.getRecordsNoSync();
      await this.sendDataInServer(records);
      resolve();
    });
  }

  sendDataRecursion() {
    this.isSend$.next(true);
    return new Promise(async (resolve, reject) => {
      const records: any = await this.getRecordsNoSyncAll();
      await this.sendDataInServer(records);
      this.isSend$.next(false);
      resolve();
    });
  }

  sendDataInServer(rows) {
    return new Promise(async (resolve, reject) => {
      const user = this.authService.authUser$.getValue();
      if (rows.length > 0 && user != null) {
        const url = environment.apiUrl + '/livemetrics';
        const headers = {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + user.accessToken
        };

        try {
          await this.http.setServerTrustMode('nocheck');
          this.http.setDataSerializer('json');

          const records = rows.map(({rowid, ts, name, value}) => ({rowid, ts, name, value}));
          const response = await this.http.post(
            url,
            {liveMetrics: records},
            headers);
          const data = JSON.parse(response.data);
          await this.setIsSync(data);
          resolve();
        } catch (err) {
          console.log('[INFO] HTTP Error: ' + JSON.stringify(err));
          reject();
        }
      }
      resolve();
    });
  }

  clearTreeDayData() {

  }

}

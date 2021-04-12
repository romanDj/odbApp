import {Injectable} from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';


@Injectable({
  providedIn: 'root'
})
export class LiveMetricsService {

  private database: SQLiteObject;

  constructor(private sqlite: SQLite) {
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

  getHistory() {
    return new Promise((resolve, reject) => {
      this.database.transaction(tx => {
        tx.executeSql('SELECT  * FROM liveMetric ORDER BY ts DESC LIMIT 1000;', [], (_, {rows}) => {
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
}

import {Injectable} from '@angular/core';
import {AlertController, Platform, ToastController} from '@ionic/angular';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';
import {
  BackgroundGeolocation,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationResponse,
  BackgroundGeolocationAuthorizationStatus
} from '@ionic-native/background-geolocation/ngx';
import {File, FileEntry} from '@ionic-native/file/ngx';
import {Network, Connection} from '@ionic-native/network/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';

import {BehaviorSubject, defer, interval, Observable, Subscription, forkJoin, merge, timer, of, empty, from, throwError} from 'rxjs';
import {
  catchError,
  finalize,
  mapTo,
  switchMap,
  take,
  takeUntil,
  tap,
  concatMap,
  concatAll,
  filter,
  mergeMap,
  map,
  first, scan, publish, share
} from 'rxjs/operators';
import {BluetoothService} from './bluetooth.service';
import {ConfigOdb, ConfigOdbService} from './config-odb.service';
import {obdinfo} from '../utils/obdInfo.js';
import * as moment from 'moment';
import * as _ from 'underscore';
import {rejects} from 'assert';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {LiveMetricsService} from './live-metrics.service';


const gpsConfig: BackgroundGeolocationConfig = {
  desiredAccuracy: 10,
  stationaryRadius: 20,
  distanceFilter: 30,
  startForeground: true,
  notificationsEnabled: false,
  debug: false,
  stopOnTerminate: true,
  notificationTitle: 'Сбор данных odb и геопозиции включен'
};


/**
 * Выполнятся каждые 20 секунд
 * При подключении -> сбрасывается таймер, начинатся попытка подключиться к устройству OBD каждые 20 сек
 * При подключении к OBD собирайте метрики в режиме реального времени
 * 0-5 минут потеря связи с устройствами OBD -> повторите попытку подключения через 20 секунд, не спите
 *  тем временем, если доступна сеть Wi-Fi, загрузите данные
 *  Через 5 минут после потери связи с устройством OBD,
 *    если он не подключен к источнику питания (если данные не отправляются) -> выйти из приложения, разрешить глубокий сон
 *  Через 10 минут после потери связи с устройством OBD,
 *    если он не подключен к источнику питания (даже отправка данных) -> выйти из приложения, разрешить глубокий сон
 */

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  private statusTask$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly statusTask = this.statusTask$.asObservable();
  isNetworkConnectivity = false;

  // Bluetooth
  private connStatus$: BehaviorSubject<string> = new BehaviorSubject<string>('Отключено');
  connStatus = this.connStatus$.asObservable();
  defaultBluetoothDev = '';
  lastConnectedToOBD;
  btIsConnecting = false;
  btConnected = false;
  queue = [];
  receivedData = '';
  activePollers = [];
  writeDelay = 50;
  lastRPMmetricvalue;
  lastRPMmetricTimestamp;
  liveMetrics = {};

  odbMetrics = [];

  constructor(
    private backgroundMode: BackgroundMode,
    private backgroundGeolocation: BackgroundGeolocation,
    private network: Network,
    private http: HTTP,
    private toastCtrl: ToastController,
    private bluetoothSerial: BluetoothSerial,
    private alertCtrl: AlertController,
    private file: File,
    private bluetoothService: BluetoothService,
    private configOdbService: ConfigOdbService,
    private sqlite: SQLite,
    private liveMetricsService: LiveMetricsService) {
  }

  async init() {
    this.backgroundMode.setDefaults({
      title: 'odbApp',
      text: 'Данные считываются с odb в реальном времени',
      resume: false,
      hidden: true,
      bigText: false,
      silent: true
    });
    this.lastConnectedToOBD = Date.now();

    this.configOdbService.configOdb.subscribe((config: ConfigOdb) => {
      this.odbMetrics = config.odbMetrics.map(metric => {
        const getPID = obdinfo.PIDS.find(p => p.name === metric);
        if (getPID && getPID.mode === obdinfo.modeRealTime && getPID.name !== '') {
          return {
            metricSelectedToPoll: true,
            name: getPID.name,
            description: getPID.description ? getPID.description : '',
            value: '',
            unit: getPID.unit
          };
        }
        return null;
      }).filter(x => x !== null);
    });

    // подписка на запуск фоновой задачи
    this.backgroundMode.on('enable').pipe(
      switchMap(() =>
        defer(() => {
          this.onStart();
          return this.checkBluetoothEnabled().pipe(
            finalize(() => this.onStop()),
            takeUntil(this.backgroundMode.on('disable'))
          );
          // return timer(0, 10000).pipe(
          //   concatMap((n) => this.task()),
          //   finalize(() => this.onStop()),
          //   takeUntil(this.backgroundMode.on('disable'))
          // );
        }).pipe(
          catchError((err) => {
            this.showError(err);
            console.log('[error] ' + err);
            this.onStop();
            this.disable();
            return empty();
          }),
        )
      )
    ).subscribe();
    // await this.initDB();
    this.subscribeToNetworkChanges();
    this.enableGPSTracking();
  }

  showError(error) {
    return new Promise((resolve, reject) => {
      this.alertCtrl.create({
        message: error,
        subHeader: 'Ошибка',
        buttons: ['OK']
      }).then(alert => alert.present().then(() => resolve()))
        .catch(() => reject());
    });
  }

  enable(): void {
    this.liveMetrics = {};
    this.backgroundMode.enable();
    this.backgroundGeolocation.start();
  }

  disable(): void {
    this.backgroundMode.disable();
    this.backgroundGeolocation.stop();
    this.bluetoothSerial.disconnect().then(() => {
      this.connStatus$.next('Отключено');
    });
  }

  onStart() {
    console.log('-- background mode enabled');
    this.backgroundMode.disableWebViewOptimizations();
    this.statusTask$.next(true);
  }

  onStop() {
    console.log('-- background mode disabled');
    this.statusTask$.next(false);
  }

  updateStatus(val?: boolean): void {
    if (val !== undefined && val != null) {
      this.statusTask$.next(val);
    } else {
      this.backgroundGeolocation.checkStatus().then((status) => {
        this.statusTask$.next(this.backgroundMode.isEnabled() || status.isRunning);
      }).catch(() => {
        this.statusTask$.next(this.backgroundMode.isEnabled());
      });

    }
  }

  task(): Observable<any> {
    const today: Date = new Date();
    console.log('task run watch  | ' + `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`);

    return of([]);

    // return this.checkBluetoothEnabled();

    // Upload data if there is wifi and not send to csv
    // if (!this.btConnected && this.isNetworkConnectivity) {
    //   if (this.uploadingData) {
    //     console.log('[INFO] Wifi detected, attempting to upload data but still uploading previous cycle, retrying in 20 seconds...');
    //     return;
    //   }
    //   this.uploadData();
    // }
    // Upload data if is sending to
    // if (this.globalconfig.dataUpload.mode == 'CSV' && this.liveStatsNumRecordsToSend > 0) {
    //   if (this.uploadingData) {
    //     console.log('[INFO] Attempting to save to csv but still uploading previous cycle, retrying in 20 seconds...');
    //     return;
    //   }
    //   this.uploadData();
    // }
  }

  // Network

  subscribeToNetworkChanges() {
    const offlineStatuses = [`unknown`, `cellular`, `none`];
    if (!offlineStatuses.includes(this.network.type)) {
      this.isNetworkConnectivity = true;
    }

    const universalStream = merge(
      this.network.onDisconnect().pipe(mapTo(false)),
      this.network.onConnect().pipe(mapTo(true))
    );
    universalStream.subscribe((val) => {
      this.isNetworkConnectivity = val;
    });
  }

  // GPS

  enableGPSTracking(): void {
    this.backgroundGeolocation.checkStatus().then((status) => {
      console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
      console.log('[INFO] BackgroundGeolocation services enabled', status.locationServicesEnabled);
      console.log('[INFO] BackgroundGeolocation auth status: ' + status.authorization);

      if (!status.locationServicesEnabled) {
        return this.backgroundGeolocation.showLocationSettings();
      }
      if (status.authorization === BackgroundGeolocationAuthorizationStatus.NOT_AUTHORIZED) {
        return this.backgroundGeolocation.showAppSettings();
      }
    });

    this.backgroundGeolocation.configure(gpsConfig)
      .then(() => {
        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location).subscribe((location: BackgroundGeolocationResponse) => {
          console.log('[INFO] Location: ' + location.time + ', Lat: ' + location.latitude + ', Lon: ' + location.longitude);
          const objData = {
            name: 'location',
            value: JSON.stringify({latitude: location.latitude, longitude: location.longitude})
          };
          this.btEventEmit('dataReceived', objData);

          // for ios
          this.backgroundGeolocation.startTask().then((taskKey: number): void => {
            this.backgroundGeolocation.endTask(taskKey);
          });
        });
      });
  }


  // Bluetooth

  checkBluetoothEnabled(): Observable<any> {
    return of(
      from(this.bluetoothSerial.isEnabled()).pipe(mapTo(null)),
      this.configOdbService.configOdb.pipe(
        take(1),
        switchMap((config: ConfigOdb) => defer(() => {
          if (config.bluetoothDeviceToUse.address === undefined ||
            config.bluetoothDeviceToUse.address === null ||
            config.bluetoothDeviceToUse.address.length === 0) {
            throw new Error('Device no selected');
          }
          this.connStatus$.next('Подключено');
          this.btIsConnecting = true;
          return this.connectBluetooth(
            config.bluetoothDeviceToUse.address,
            config.bluetoothDeviceToUse.name
          );
        }))
      )
    ).pipe(
      concatAll(),
      filter(x => x != null)
    );
  }

  connectBluetooth(address, name): Observable<any> {
    return this.bluetoothSerial.connect(address).pipe(
      tap((val) => {
        console.log('connected');
        this.btConnected = true;
        this.btIsConnecting = false;
        this.connStatus$.next('Подключено');
        this.defaultBluetoothDev = name;
      }),
      catchError((err) => {
        this.connStatus$.next('Ошибка');
        this.btIsConnecting = false;
        this.btConnected = false;
        this.btDisconnect();
        return throwError(err);
      }),
      mergeMap(() => this.deviceConnected())
    );
  }

  deviceConnected(): Observable<any> {
    this.lastConnectedToOBD = Date.now();
    // this.backgroundGeolocation.start()
    this.initCommunication();

    return merge(
      // канал для получения и чтения данных с устройства
      this.bluetoothSerial.subscribe('>').pipe(
        tap((val) => {
          this.btDataReceived(val);
        }),
        catchError((err) => {
          console.log('[error] Received error - ' + err);
          return throwError(err);
        })
      ),
      // инициализация и настройка метрик, таймеров
      this.connectInterval()
    );
  }

  initCommunication() {
    this.btWrite('ATZ');
    // Turns off extra line feed and carriage return
    this.btWrite('ATL0');
    // This disables spaces in in output, which is faster!
    this.btWrite('ATS0');
    // Turns off headers and checksum to be sent.
    this.btWrite('ATH0');
    // Turns off echo.
    this.btWrite('ATE0');
    // Turn adaptive timing to 2. This is an aggressive learn
    // curve for adjusting the timeout. Will make huge difference on slow systems.
    this.btWrite('ATAT2');
    // Set timeout to 10 * 4 = 40msec, allows +20 queries per second.
    // This is the maximum wait-time. ATAT will decide if it should wait shorter or not.
    // btWrite('ATST0A');
    this.btWrite('ATSP0'); // Set the protocol to automatic.

    // Event connected
    // this.btEventEmit('Communication Initiated....');
    this.btConnected = true;
  }

  btWrite(message, replies = 0) {
    if (this.btConnected) {
      if (this.queue.length < 256) {
        if (replies !== 0) {
          this.queue.push(message + replies + '\r');
        } else {
          this.queue.push(message + '\r');
        }
      } else {
        this.btEventEmit('error', 'Queue-overflow!');
      }
    } else {
      this.btEventEmit('error', 'Bluetooth device is not connected.');
    }
  }

  btEventEmit(event, text?) {
    let pdata = {ts: 0, name: '', value: ''};

    if (event !== 'dataReceived' || text.value === 'NO DATA' || text.name === undefined || text.value === undefined) {
      return;
    }
    console.log('[INFO] Metric for ' + JSON.stringify(text));
    pdata = {ts: moment().valueOf(), name: text.name, value: text.value};

    this.liveMetricsService.push(pdata.name, pdata.value, pdata.ts);

    if (pdata.name === 'rpm') {
      this.lastRPMmetricTimestamp = pdata.ts;
      this.lastRPMmetricvalue = pdata.value;
    }
    if (pdata.name !== 'location') {
      if (this.liveMetrics[pdata.name] === undefined) {
        const mt = _.findWhere(this.odbMetrics, {name: pdata.name});
        this.liveMetrics[pdata.name] = {};
        this.liveMetrics[pdata.name].description = mt.description ? mt.description : '';
        this.liveMetrics[pdata.name].name = mt.name;
        this.liveMetrics[pdata.name].unit = mt.unit;
        this.liveMetrics[pdata.name].type = '';
      }
      this.liveMetrics[pdata.name].value = pdata.value;
      if (this.liveMetrics[pdata.name].unit === 'sec.' || this.liveMetrics[pdata.name].type === 's') {
        // tslint:disable-next-line:radix
        this.liveMetrics[pdata.name].value = moment.utc(parseInt(pdata.value)).format('HH:mm:ss');
        this.liveMetrics[pdata.name].unit = '';
        this.liveMetrics[pdata.name].type = 's';
      }
    } else {  // location data
      if (this.liveMetrics['latitude'] == undefined) {
        this.liveMetrics['latitude'] = {};
        this.liveMetrics['latitude'].description = 'Location: latitude';
        this.liveMetrics['latitude'].name = '';
        this.liveMetrics['latitude'].unit = '°';
        this.liveMetrics['latitude'].type = '';
      }
      this.liveMetrics['latitude'].value = JSON.parse(pdata.value).latitude;
      if (this.liveMetrics['longitude'] == undefined) {
        this.liveMetrics['longitude'] = {};
        this.liveMetrics['longitude'].description = 'Location: longitude';
        this.liveMetrics['longitude'].name = '';
        this.liveMetrics['longitude'].unit = '°';
        this.liveMetrics['longitude'].type = '';
      }
      this.liveMetrics['longitude'].value = JSON.parse(pdata.value).longitude;
    }
  }

  btDataReceived(data) {
    this.lastConnectedToOBD = Date.now();

    const currentString = this.receivedData + data.toString(); // making sure it's a utf8 string
    const arrayOfCommands = currentString.split('>');

    let forString;
    if (arrayOfCommands.length < 2) {
      this.receivedData = arrayOfCommands[0];
    } else {
      for (const command of arrayOfCommands) {
        forString = command;
        if (forString === '') {
          continue;
        }

        const multipleMessages = forString.split('\r');
        for (const message of multipleMessages) {
          const messageString = message;
          if (messageString === '') {
            continue;
          }
          let reply;
          reply = this.parseOBDCommand(messageString);
          this.btEventEmit('dataReceived', reply);
          this.receivedData = '';
        }
      }
    }
  }

  parseOBDCommand(hexString) {
    // tslint:disable-next-line:one-variable-per-declaration
    let reply: { value?: any; mode?: any; pid?: any; name?: any; },
      byteNumber,
      valueArray; // New object

    reply = {};
    if (hexString === 'NO DATA' || hexString === 'OK' || hexString === '?' || hexString === 'UNABLE TO CONNECT' || hexString === 'SEARCHING...') {
      // No data or OK is the response, return directly.
      reply.value = hexString;
      return reply;
    }

    // Whitespace trimming //Probably not needed anymore?
    hexString = hexString.replace(/ /g, '');
    valueArray = [];

    for (byteNumber = 0; byteNumber < hexString.length; byteNumber += 2) {
      valueArray.push(hexString.substr(byteNumber, 2));
    }

    if (valueArray[0] === '41') {
      reply.mode = valueArray[0];
      reply.pid = valueArray[1];

      for (const PID of obdinfo.PIDS) {
        if (PID.pid === reply.pid) {
          const numberOfBytes = PID.bytes;
          reply.name = PID.name;
          switch (numberOfBytes) {
            case 1:
              reply.value = PID.convertToUseful(valueArray[2]);
              break;
            case 2:
              reply.value = PID.convertToUseful2(valueArray[2], valueArray[3]);
              break;
            case 4:
              reply.value = PID.convertToUseful4(valueArray[2], valueArray[3], valueArray[4], valueArray[5]);
              break;
            case 6:
              reply.value = PID.convertToUseful6(valueArray[2],
                valueArray[3], valueArray[4], valueArray[5], valueArray[6], valueArray[7]);
              break;
          }
          // Value is converted, break out the for loop.
          break;
        }
      }
    } else if (valueArray[0] === '43') {
      reply.mode = valueArray[0];
      for (const PID of obdinfo.PIDS) {
        if (PID.mode === '03') {
          reply.name = PID.name;
          reply.value = PID.convertToUseful6(valueArray[1], valueArray[2],
            valueArray[3], valueArray[4], valueArray[5], valueArray[6]);
        }
      }
    }
    return reply;
  }

  connectInterval(): Observable<any> {
    return defer(() => {
      const totalMetrics = this.odbMetrics.reduce((acc, curr) => {
        this.addPoller(curr.name);
        return acc + 1;
      }, 0);
      let pollingInterval = totalMetrics * 50 * 4;
      if (pollingInterval < 4000) {
        pollingInterval = 4000;
      }

      return merge(
        // интервал отправляет периодически данные в очередь
        interval(pollingInterval).pipe(
          tap(() => this.writePollers.bind(this)()),
          takeUntil(this.backgroundMode.on('disable'))
        ),
        // интервал отправляет периодически данные на устройство из очереди
        this.enableIntervalWriter()
      );
    });
  }

  enableIntervalWriter(): Observable<any> {
    // Updated with Adaptive Timing on ELM327. 20 queries a second seems good enough.
    return interval(this.writeDelay).pipe(
      mergeMap(() => defer(() => {
        if (this.queue.length > 0 && this.btConnected) {
          const writeData = this.queue.shift();
          return from(new Promise((resolve, reject) => {
            this.bluetoothSerial.write(writeData + '\r')
              .then((success) => {
                this.btEventEmit('wrote data ', writeData);
              }).catch((err) => {
                this.btEventEmit('error', err);
              }
            );
          }));
        }
        return empty();
      })),
      catchError((err) => {
        this.btEventEmit('error', 'Error while writing: ' + err);
        this.btEventEmit('error', 'OBD-II Listeners deactivated, connection is probably lost.');
        this.removeAllPollers();
        return empty();
      }),
      takeUntil(this.backgroundMode.on('disable'))
    );
  }

  getPIDByName(name) {
    for (const PID of obdinfo.PIDS) {
      if (PID.name === name) {
        if (PID.pid !== undefined) {
          return (PID.mode + PID.pid);
        }
        return PID.mode;
      }
    }
  }

  addPoller(name) {
    const stringToSend = this.getPIDByName(name);
    this.activePollers.push(stringToSend);
  }

  removePoller(name) {
    const stringToDelete = this.getPIDByName(name);
    const index = this.activePollers.indexOf(stringToDelete);
    this.activePollers.splice(index, 1);
  }

  removeAllPollers() {
    this.activePollers = [];
  }

  writePollers() {
    for (const actPoll of this.activePollers) {
      this.btWrite(actPoll, 1);
    }
  }

  btDisconnect() {
    // clearInterval(this.btIntervalWriter);
    this.queue = [];
    this.btConnected = false;
    this.btIsConnecting = false;
    console.log('[INFO] Disconnected');
    this.lastConnectedToOBD = Date.now();
    // this.backgroundGeolocation.stop();
  }

}

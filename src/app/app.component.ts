import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';

import {IonRouterOutlet, Platform} from '@ionic/angular';
import {AlertController, ToastController, NavController} from '@ionic/angular';


import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {
  BackgroundGeolocation,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationResponse,
  BackgroundGeolocationAuthorizationStatus
} from '@ionic-native/background-geolocation/ngx';
import {File} from '@ionic-native/file/ngx';
import * as moment from 'moment';
import * as _ from 'underscore';
import {Insomnia} from '@ionic-native/insomnia/ngx';
import {BatteryStatus} from '@ionic-native/battery-status/ngx';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Network} from '@ionic-native/network/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';

const gpsConfig: BackgroundGeolocationConfig = {
  desiredAccuracy: 10,
  stationaryRadius: 20,
  distanceFilter: 30,
  startForeground: true,
  notificationsEnabled: true,
  debug: false,
  stopOnTerminate: true
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  mainWatcher = null;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private backgroundGeolocation: BackgroundGeolocation,
    private file: File, private batteryStatus: BatteryStatus,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private bluetoothSerial: BluetoothSerial,
    private toastCtrl: ToastController,
    private sqlite: SQLite,
    private network: Network,
    private http: HTTP,
    private backgroundMode: BackgroundMode) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.backgroundMode.setDefaults({
        title: 'odbApp',
        text: 'Данные считываются с odb в реальном времени',
        // color: 'F14F4D',
        resume: false,
        hidden: false,
        bigText: false
      });
      if (this.mainWatcher == null) {
        this.backgroundMode.on('activate').subscribe(() => this.startWatchData());
      }
      // this.backgroundMode.on('deactivate').subscribe(() => this.backgroundTask());
      this.backgroundMode.enable();
      this.backgroundMode.moveToBackground();
      this.enableGPSTracking();
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    console.log('ngOnDestory - Home Page');
  }

  startWatchData() {
    const num: number = Math.floor(Math.random() * (100 - 1)) + 1;
    const ff = () => this.backgroundTask(num);
    // tslint:disable-next-line:only-arrow-functions
    this.mainWatcher = setInterval(function() {
      ff();
    }, 5000);
  }

  stopWatchData() {
    clearInterval(this.mainWatcher);
  }

  backgroundTask(num: number) {
    console.log('task run watch ' + num);
    // if (this.backgroundMode.isActive()) {
    //   console.log('run background task');
    // } else {
    //   console.log('run foreground task');
    // }
  }

  enableGPSTracking() {
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
          const objdata = {
            name: 'location',
            value: JSON.stringify({latitude: location.latitude, longitude: location.longitude})
          };
          // this.btEventEmit('dataReceived', objdata);

          // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
          // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
          // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
          //  this.backgroundGeolocation.finish(); // FOR IOS ONLY
        });
      });
    this.backgroundGeolocation.start();
  }
}
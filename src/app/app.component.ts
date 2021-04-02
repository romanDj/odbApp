import {Component} from '@angular/core';
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




@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
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
    private http: HTTP) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}

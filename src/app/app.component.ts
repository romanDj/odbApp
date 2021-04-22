import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';

import {IonRouterOutlet, Platform} from '@ionic/angular';
import {AlertController, ToastController, NavController} from '@ionic/angular';

import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {BackgroundGeolocation} from '@ionic-native/background-geolocation/ngx';
import {File} from '@ionic-native/file/ngx';
import {BatteryStatus} from '@ionic-native/battery-status/ngx';
import {SQLite} from '@ionic-native/sqlite/ngx';
import {Network} from '@ionic-native/network/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';

import {BackgroundTaskService} from './services/background-task.service';
import {ConfigOdbService} from './services/config-odb.service';
import {BluetoothService} from './services/bluetooth.service';
import {LiveMetricsService} from './services/live-metrics.service';
import {UserStoreService} from './services/user-store.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private backgroundGeolocation: BackgroundGeolocation,
    private file: File, private batteryStatus: BatteryStatus,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private bluetoothSerial: BluetoothSerial,
    private toastCtrl: ToastController,
    private sqlite: SQLite,
    private network: Network,
    private http: HTTP,
    private backgroundTaskService: BackgroundTaskService,
    private configOdbService: ConfigOdbService,
    private bluetoothService: BluetoothService,
    private liveMetricsService: LiveMetricsService,
    private userStoreService: UserStoreService
  ) {
  }

  ngOnInit() {
    this.initializeApp();
  }

  ngOnDestroy() {
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      this.splashScreen.hide();
      await this.configOdbService.init();
      await this.userStoreService.init();
      await this.liveMetricsService.init();
      await this.bluetoothService.init();
      await this.backgroundTaskService.init();
    });
  }

}

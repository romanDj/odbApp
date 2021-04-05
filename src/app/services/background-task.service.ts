import {Injectable} from '@angular/core';
import {Platform} from '@ionic/angular';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';
import {
  BackgroundGeolocation,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationResponse,
  BackgroundGeolocationAuthorizationStatus
} from '@ionic-native/background-geolocation/ngx';

import {interval, Observable, Subscription} from 'rxjs';


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

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  id: number;
  subscription: Subscription;
  lifecycle;

  constructor(public backgroundMode: BackgroundMode, public backgroundGeolocation: BackgroundGeolocation) {
  }

  init(): void {
    this.subscription = new Subscription();
    this.lifecycle = interval(5000);

    this.backgroundMode.setDefaults({
      title: 'odbApp',
      text: 'Данные считываются с odb в реальном времени',
      resume: false,
      hidden: true,
      bigText: false,
      silent: true
    });

    this.id = Math.floor(Math.random() * (100 - 1)) + 1;

    this.backgroundMode.on('enable').subscribe(() => {
      console.log('-- background mode enabled');
      this.backgroundMode.disableWebViewOptimizations();
      this.start();
    });

    this.backgroundMode.on('disable').subscribe(() => {
      console.log('-- background mode disabled');
      this.stop();
    });

    // init geolocation
    this.enableGPSTracking();
  }

  enable(): void {
    this.backgroundMode.enable();
    this.backgroundGeolocation.start();
  }

  disable(): void {
    this.backgroundMode.disable();
    this.backgroundGeolocation.stop();
  }

  start(): void {
    console.log('start init');
    this.subscription = new Subscription();
    this.lifecycle = interval(5000);
    const subscription = this.lifecycle.subscribe((): Promise<any> => this.task());
    this.subscription.add(subscription);
  }

  stop(): void {
    this.subscription.unsubscribe();
  }

  async task(): Promise<any> {
    const today: Date = new Date();
    console.log('task run watch ' + this.id + ' | ' + `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`);
  }

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
          const objdata = {
            name: 'location',
            value: JSON.stringify({latitude: location.latitude, longitude: location.longitude})
          };
          // this.btEventEmit('dataReceived', objdata);

          // for ios
          this.backgroundGeolocation.startTask().then((taskKey: number): void => {
            this.backgroundGeolocation.endTask(taskKey);
          });
        });
      });
  }
}

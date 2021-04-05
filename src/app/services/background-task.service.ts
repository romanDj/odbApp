import {Injectable} from '@angular/core';
import {Platform} from '@ionic/angular';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';

import {interval, Observable, Subscription} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  id: number;
  subscription: Subscription;
  lifecycle;

  constructor(public backgroundMode: BackgroundMode) {
    this.subscription = new Subscription();
    this.lifecycle = interval(5000);
  }

  init(): void {
    this.backgroundMode.setDefaults({
      title: 'odbApp',
      text: 'Данные считываются с odb в реальном времени',
      resume: false,
      hidden: false,
      bigText: false
    });

    this.id = Math.floor(Math.random() * (100 - 1)) + 1;

    this.backgroundMode.on('enable').subscribe(() => {
      console.log('-- background mode enabled');
      this.start();
    });

    this.backgroundMode.on('disable').subscribe(() => {
      console.log('-- background mode disabled');
      this.stop();
    });

  }

  enable(): void {
    this.backgroundMode.enable();
  }

  disable(): void {
    this.backgroundMode.disable();
  }

  start(): void {
    const subscription  = this.lifecycle.subscribe((): void => this.task());
    this.subscription.add(subscription);
  }

  stop(): void {
    this.subscription.unsubscribe();
  }

  task(): void {
    const today: Date = new Date();
    console.log('task run watch ' + this.id + ' | ' + `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`);
  }
}

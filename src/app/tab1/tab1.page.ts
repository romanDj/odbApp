import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackgroundTaskService} from '../services/background-task.service';
import {ConfigOdb, ConfigOdbService} from '../services/config-odb.service';
import {Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import {Platform} from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  subscription: Subscription;
  resumeSubscription: Subscription;
  configOdb: ConfigOdb;

  constructor(
    private platform: Platform,
    private backgroundTaskService: BackgroundTaskService,
    private configOdbService: ConfigOdbService) {
  }

  ngOnInit() {
    this.subscription = this.configOdbService.configOdb.subscribe(configOdb$ => {
      this.configOdb = configOdb$;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ionViewDidEnter() {
    this.resumeSubscription = this.platform.resume.subscribe(async () => {
      this.backgroundTaskService.updateStatus();
    });
    this.backgroundTaskService.updateStatus();
  }

  ionViewDidLeave() {
    this.resumeSubscription.unsubscribe();
  }

  statusClick(val) {
    if (val) {
      this.backgroundTaskService.disable();
    } else {
      this.backgroundTaskService.enable();
    }
  }

  loggedConfig() {
    console.log(this.configOdb);
  }

}

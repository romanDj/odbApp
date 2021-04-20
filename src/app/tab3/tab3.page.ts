import {Component, ViewChild} from '@angular/core';
import {LiveMetricsService} from '../services/live-metrics.service';
import * as moment from 'moment';
import {obdinfo} from '../utils/obdInfo.js';
import {Subscription} from 'rxjs';
import {Platform} from '@ionic/angular';
import {BackgroundTaskService} from '../services/background-task.service';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  @ViewChild(IonContent) content: IonContent;
  resumeSubscription: Subscription;
  liveMetrics: any = [];
  needSync = false;

  constructor(
    private platform: Platform,
    private liveMetricsService: LiveMetricsService,
    private backgroundTaskService: BackgroundTaskService
  ) {
  }

  async ionViewDidEnter() {
    this.resumeSubscription = this.platform.resume.subscribe(async () => {
      this.loadData();
    });
    this.loadData();
  }

  ionViewDidLeave() {
    this.resumeSubscription.unsubscribe();
  }

  loadData() {
    this.content.scrollToTop();
    this.needSync = false;
    this.liveMetricsService.getHistory().then((data: any[]) => {
      this.liveMetrics = data.map(x => {
        // tslint:disable-next-line:one-variable-per-declaration
        let value = x.value,
          description = '',
          unit = '';
        if (x.isSend === 0){
          this.needSync = true;
        }
        if (x.name === 'location') {
          try {
            value = JSON.parse(x.value);
          } catch (e) {
            console.log('[ERR] Parse ' + JSON.stringify(e));
          }
          description = x.name;
        } else {
          const findItem = obdinfo.PIDS.find(pid => pid.name === x.name);
          if (findItem) {
            description = findItem.description || '';
            unit = findItem.unit || '';
          }
        }
        return {
          ...x,
          value,
          description,
          unit,
          ts: moment(x.ts).format('YYYY-MM-DD HH:mm:ss')
        };
      });
    });
  }

  synchronization(){
    this.liveMetricsService.sendDataRecursion().then(() => {
      this.loadData();
    });
  }

}

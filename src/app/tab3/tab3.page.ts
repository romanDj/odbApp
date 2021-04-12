import {Component} from '@angular/core';
import {LiveMetricsService} from '../services/live-metrics.service';
import * as moment from 'moment';
import {obdinfo} from '../utils/obdInfo.js';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  liveMetrics: any = [];

  constructor(
    private liveMetricsService: LiveMetricsService
  ) {
  }

  ionViewDidEnter() {
    this.loadData();
  }

  ionViewDidLeave() {

  }

  loadData() {
    this.liveMetricsService.getHistory().then((data: any[]) => {
      this.liveMetrics = data.map(x => {
        // tslint:disable-next-line:one-variable-per-declaration
        let value = x.value,
          description = '',
          unit = '';
        if (x.name === 'location'){
          try{
            value = JSON.parse(x.value);
          }catch (e) {
            console.log('[ERR] Parse ' + JSON.stringify(e));
          }
          description = x.name;
        }else{
          const findItem = obdinfo.PIDS.find(pid => pid.name === x.name);
          if (findItem){
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
      console.log(this.liveMetrics);
    });
  }
}

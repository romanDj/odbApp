import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackgroundTaskService} from '../services/background-task.service';
import {ConfigOdbService} from '../services/config-odb.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  statusBackgroundTask = null;

  constructor(public backgroundTaskService: BackgroundTaskService, public configOdbService: ConfigOdbService) {}

  ngOnInit(){
    this.statusBackgroundTask = this.backgroundTaskService.id;
  }

  ngOnDestroy() {
  }

  enableTask(){
    this.backgroundTaskService.enable();
  }

  disableTask(){
    this.backgroundTaskService.disable();
  }

  loggedConfig(){
    this.configOdbService.read().then(data => {
      console.log(data);
    });
  }

}

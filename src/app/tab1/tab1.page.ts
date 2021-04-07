import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackgroundTaskService} from '../services/background-task.service';
import {ConfigOdb, ConfigOdbService} from '../services/config-odb.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  public subscription: Subscription;
  public configOdb: ConfigOdb;

  constructor(
    private backgroundTaskService: BackgroundTaskService,
    private configOdbService: ConfigOdbService) {}

  ngOnInit(){
    this.subscription =  this.configOdbService.configOdb.subscribe(configOdb$ => {
      this.configOdb = configOdb$;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  enableTask(){
    this.backgroundTaskService.enable();
  }

  disableTask(){
    this.backgroundTaskService.disable();
  }

  loggedConfig(){
    console.log(this.configOdb);
  }

}

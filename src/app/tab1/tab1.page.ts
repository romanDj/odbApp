import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, OnChanges} from '@angular/core';
import {BackgroundTaskService} from '../services/background-task.service';
import {ConfigOdb, ConfigOdbService} from '../services/config-odb.service';
import {Subject, Subscription} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {Platform} from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  subscription: Subscription;
  configOdb: ConfigOdb;

  private destroyed$ = new Subject();

  constructor(
    private platform: Platform,
    private backgroundTaskService: BackgroundTaskService,
    private configOdbService: ConfigOdbService,
    private cdr: ChangeDetectorRef) {
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
    this.platform.resume.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(async () => {
      this.backgroundTaskService.updateStatus();
    });
    this.backgroundTaskService.connStatus.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });

    this.backgroundTaskService.updateStatus();
  }

  ionViewDidLeave() {
    this.destroyed$.next();
    this.destroyed$.complete();
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

  loggedMetrics() {
    console.log('--values metrics--');
    console.log(JSON.stringify(this.backgroundTaskService.lastRPMmetricvalue));
    console.log(JSON.stringify(this.backgroundTaskService.lastRPMmetricTimestamp));
    console.log(JSON.stringify(this.backgroundTaskService.liveMetrics));
    console.log('--end metrics--');
  }

}

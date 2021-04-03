import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  statusBackgroundTask = null;

  constructor(private backgroundMode: BackgroundMode) {}

  ngOnInit(){
    this.statusBackgroundTask = this.backgroundMode.isActive();
  }

  ngOnDestroy() {
  }

  enableTask(){
    this.backgroundMode.enable();
  }

  disableTask(){
    this.backgroundMode.disable();
  }

}

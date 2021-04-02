import {Component} from '@angular/core';
import {IonRouterOutlet, Platform} from '@ionic/angular';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(private platform: Platform,
              private routerOutlet: IonRouterOutlet,
              private backgroundMode: BackgroundMode) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        // navigator['app'].exitApp();
        this.backgroundMode.overrideBackButton();
      }
    });
  }

}
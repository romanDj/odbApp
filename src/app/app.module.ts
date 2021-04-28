import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Network} from '@ionic-native/network/ngx';
import {HTTP} from '@ionic-native/http/ngx';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BackgroundGeolocation} from '@ionic-native/background-geolocation/ngx';
import {File} from '@ionic-native/file/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

import {IonicModule, IonicRouteStrategy, IonRouterOutlet, Platform} from '@ionic/angular';
import {IonicStorageModule} from '@ionic/storage-angular';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    IonicStorageModule.forRoot()],
  providers: [
    Platform,
    StatusBar,
    SplashScreen,
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    File,
    SQLite,
    Network,
    HTTP,
    BackgroundGeolocation,
    BluetoothSerial,
    BackgroundMode,
    LocalNotifications
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}

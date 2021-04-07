import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {File} from '@ionic-native/file/ngx';
import {ConfigOdb, ConfigOdbService} from '../services/config-odb.service';
import {obdinfo} from '../utils/obdInfo.js';
import {AlertController} from '@ionic/angular';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BluetoothService, PairedDevice} from '../services/bluetooth.service';
import {Subscription} from 'rxjs';
import {catchError, take} from 'rxjs/operators';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {

  public subscription: Subscription;
  public configOdb: ConfigOdb;
  isEdit = false;
  isSaving = false;
  alertOptions: any = {
    header: 'Список устройств',
    translucent: true
  };
  pairedDevice: PairedDevice;
  pairedDeviceId = '';

  constructor(
    private file: File,
    private configOdbService: ConfigOdbService,
    private alertCtrl: AlertController,
    private bluetoothSerial: BluetoothSerial,
    private bluetoothService: BluetoothService) {
    this.obdmetrics = [];
  }

  targetList = [];
  dataSend = '';
  writeDelay = 50;
  btReceivedData = '';
  btLastCheckedReceivedData = '';
  receivedData = '';
  btConnected = false;
  activePollers = [];
  pollerInterval;
  queue = [];
  btLastReceivedData = '';
  inmemoryqty = 0;
  globalLog = [];
  globalLogEnabled = true;   // disable when generating a build
  defaultbluetoothdev = '';
  showbluetoothconfig = false;
  btIsConnecting = false;
  obdmetrics: OdbMetric[];
  state = '';
  lastConnectedToOBD;
  isNetworkConnectivity = false;
  uploadingData = false;
  liveStatsNumRecordsToSend = 0;
  lastRPMmetricvalue;
  lastRPMmetricTimestamp;
  liveStatsBattery = {level: -1, isPlugged: false, lastUnplugged: 0};

  compareWithFn(o1, o2) {
    return o1 && o2 ? o1.name === o2.name : o1 === o2;
  }


  ngOnInit() {
    this.subscription = this.configOdbService.configOdb.subscribe(configOdb$ => {
      this.configOdb = configOdb$;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  configureMetricsList(): void {

  }

  edit() {
    this.bluetoothService.init();
    this.bluetoothService.listPairedDevices();
    this.pairedDevice = Object.assign({}, this.configOdb.bluetoothDeviceToUse);
    this.pairedDeviceId = Object.assign({}, this.configOdb.bluetoothDeviceToUse).id;
    this.isEdit = true;
  }

  save() {
    this.isSaving = true;
    this.configOdbService.update({
      ...this.configOdb,
      bluetoothDeviceToUse: Object.assign({}, this.pairedDevice)
    }).finally(() => {
      this.isSaving = false;
      this.isEdit = false;
    });
  }

  cancel() {
    this.isEdit = false;
  }


  selectBtDevice(ev) {
    if (ev.detail.value === null || ev.detail.value < 0) {
      return;
    }
    const subscription = this.bluetoothService.pairedList.pipe(
      take(1)
    ).subscribe((pairedList) => {
      this.pairedDevice = pairedList.find(x => x.id === ev.detail.value);
    });
  }

}

interface OdbMetric {
  metricSelectedToPoll: boolean;
  name: string;
  description: string;
  value: string;
  unit: string;
}

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigOdb, ConfigOdbService, OdbMetric} from '../services/config-odb.service';
import {obdinfo} from '../utils/obdInfo.js';
import {AlertController} from '@ionic/angular';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BluetoothService, PairedDevice} from '../services/bluetooth.service';
import {Subscription} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {BackgroundTaskService} from '../services/background-task.service';



@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {

  subscription: Subscription;
  configOdb: ConfigOdb;
  isEdit = false;
  isSaving = false;
  alertOptions: any = {
    cssClass: 'devices-alert',
    header: 'Список устройств',
    translucent: true,
  };
  pairedDevice: PairedDevice;
  pairedDeviceId = '';
  odbMetrics: OdbMetric[] = [];
  odbMetricsEnabled: OdbMetric[] = [];

  constructor(
    private configOdbService: ConfigOdbService,
    private backgroundTaskService: BackgroundTaskService,
    private alertCtrl: AlertController,
    private bluetoothSerial: BluetoothSerial,
    private bluetoothService: BluetoothService) {
  }

  ngOnInit() {
    this.subscription = this.configOdbService.configOdb.subscribe((val: ConfigOdb) => {
      this.configOdb = val;
      this.odbMetricsEnabled = this.configOdb.odbMetrics.map(x => {
        const getPID = obdinfo.PIDS.find(p => p.name === x);
        if (getPID) {
          return {
            metricSelectedToPoll: true,
            name: getPID.name,
            description: getPID.description,
            value: '',
            unit: getPID.unit
          };
        }
        return null;
      }).filter(x => x !== null);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ionViewDidEnter(){
  }

  ionViewDidLeave(){
    this.isEdit = false;
  }

  async edit() {
    this.isEdit = true;
    this.backgroundTaskService.disable();
    this.bluetoothService.init().then(() => {
      this.bluetoothService.listPairedDevices();
    });
    this.configureMetricsList();
    this.pairedDevice = Object.assign({}, this.configOdb.bluetoothDeviceToUse);
    this.pairedDeviceId = Object.assign({}, this.configOdb.bluetoothDeviceToUse).id;
  }

  save() {
    this.isSaving = true;
    this.configOdbService.update({
      odbMetrics: this.odbMetrics.filter(x => x.metricSelectedToPoll).map(x => x.name),
      bluetoothDeviceToUse: Object.assign({}, this.pairedDevice)
    }).finally(() => {
      this.isSaving = false;
      this.isEdit = false;
    });
  }

  cancel() {
    this.isEdit = false;
  }

  // Bluetooth

  selectBtDevice(ev) {
    if (ev.detail.value === null || ev.detail.value < 0) {
      return;
    }
    this.bluetoothService.pairedList.pipe(
      take(1)
    ).subscribe((pairedList) => {
      this.pairedDevice = pairedList.find(x => x.id === ev.detail.value);
    });
  }


  // Metrics

  configureMetricsList() {
    this.odbMetrics = [];
    obdinfo.PIDS.forEach((val, i) => {
      if (val.mode === obdinfo.modeRealTime && val.name !== '') {
        this.odbMetrics.push({
          metricSelectedToPoll: !!this.configOdb.odbMetrics.find(x => x === val.name),
          name: val.name,
          description: val.description,
          value: '',
          unit: val.unit
        });
      }
    });
  }

  resetMetrics() {
    this.odbMetrics.forEach((val, n) => {
      const item = obdinfo.PIDS[n];
      if (item.mode === obdinfo.modeRealTime && item.name !== ''){
        if (val.metricSelectedToPoll !== item.isDefault) {
          val.metricSelectedToPoll = item.isDefault;
        }
      }
    });
  }

}

import {Component} from '@angular/core';
import {File} from '@ionic-native/file/ngx';
import {ConfigOdbService} from '../services/config-odb.service';
import {obdinfo} from '../utils/obdInfo.js';
import {AlertController} from '@ionic/angular';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BluetoothService} from '../services/bluetooth.service';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(
    private file: File,
    public configOdbService: ConfigOdbService,
    private alertCtrl: AlertController,
    private bluetoothSerial: BluetoothSerial,
    private bluetoothService: BluetoothService) {
    this.obdmetrics = [];
  }

  alertOptions: any = {
    header: 'Список устройств',
    translucent: true
  };

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

  configureMetricsList(): void {

  }

}

interface PairedList {
  class: number;
  id: string;
  address: string;
  name: string;
  isSelected: boolean;
}

interface OdbMetric {
  metricSelectedToPoll: boolean;
  name: string;
  description: string;
  value: string;
  unit: string;
}

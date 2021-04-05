import {Component} from '@angular/core';
import {File} from '@ionic-native/file/ngx';
import {ConfigOdbService} from '../services/config-odb.service';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(private file: File, public configOdbService: ConfigOdbService) {
    this.obdmetrics = [];
    this.checkBluetoothEnabled();
  }

  pairedList: PairedList[];
  targetList = [];
  listToggle = false;
  pairedDeviceID = 0;
  dataSend = '';
  connstatus = '';
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


  checkBluetoothEnabled(): void {

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

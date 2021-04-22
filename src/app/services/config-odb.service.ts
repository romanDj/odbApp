import {Injectable} from '@angular/core';
import {File, FileEntry} from '@ionic-native/file/ngx';
import {BehaviorSubject, Observable} from 'rxjs';
import {PairedDevice} from './bluetooth.service';
import {map} from 'rxjs/operators';
import {obdinfo} from '../utils/obdInfo.js';
import {FileStoreJson} from '../utils/file-store-json';


export interface OdbMetric {
  metricSelectedToPoll: boolean;
  name: string;
  description: string;
  value: string;
  unit: string;
}

export interface IConfigOdb {
  bluetoothDeviceToUse: PairedDevice;
  odbMetrics: string[];
}

export class ConfigOdb implements IConfigOdb{
  bluetoothDeviceToUse: PairedDevice = new PairedDevice();
  odbMetrics: string[] = new Array<string>();
}


@Injectable({
  providedIn: 'root'
})
export class ConfigOdbService {

  configStore: FileStoreJson = new FileStoreJson('OdbMetrics', this.file);

  private configOdb$: BehaviorSubject<ConfigOdb> = new BehaviorSubject<ConfigOdb>(new ConfigOdb());
  readonly configOdb = this.configOdb$.asObservable();

  constructor(private file: File) {
  }

  async init() {
    const data: any = await this.configStore.read();
    this.configOdb$.next(data || new ConfigOdb());
  }

  async update(configOdb: ConfigOdb) {
    await this.configStore.save(configOdb);
    this.configOdb$.next(configOdb);
  }
}

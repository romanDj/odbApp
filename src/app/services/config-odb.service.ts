import {Injectable} from '@angular/core';
import {File, FileEntry} from '@ionic-native/file/ngx';
import {BehaviorSubject, Observable} from 'rxjs';
import {PairedDevice} from './bluetooth.service';
import {map} from 'rxjs/operators';
import {obdinfo} from '../utils/obdInfo.js';



export interface OdbMetric {
  metricSelectedToPoll: boolean;
  name: string;
  description: string;
  value: string;
  unit: string;
}

export interface ConfigOdb {
  bluetoothDeviceToUse: PairedDevice;
  odbMetrics: string[];
}


@Injectable({
  providedIn: 'root'
})
export class ConfigOdbService {

  private configOdb$: BehaviorSubject<ConfigOdb> = new BehaviorSubject<ConfigOdb>({
    odbMetrics: [],
    bluetoothDeviceToUse: {
      address: '',
      id: '',
      name: ''
    }
  });
  readonly configOdb = this.configOdb$.asObservable();

  constructor(private file: File) {}

  async init() {
    const data = await this.read();
    if (data != null && typeof data === 'string' && data.length > 0){
      try {
        const dt = JSON.parse(data);
        this.configOdb$.next(dt);
      }catch (e) {
        await this.emptySave();
      }
    }else{
      await this.emptySave();
    }
  }

  async emptySave(){
    const cfg: ConfigOdb = {
      odbMetrics: [],
      bluetoothDeviceToUse: {
        address: '',
        id: '',
        name: ''
      }
    };
    await this.save(cfg);
    this.configOdb$.next(cfg);
  }

  async update(configOdb: ConfigOdb){
    await this.save(configOdb);
    this.configOdb$.next(configOdb);
  }

  async read() {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onloadend = function() {
          resolve(this.result);
        };
        reader.readAsText(file);
      }, (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  async save(configOdb?: ConfigOdb) {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.createWriter((fileWriter) => {
        // вставка в конец файла
        // try {
        //   fileWriter.seek(fileWriter.length);
        // } catch (e) {
        //   console.log('[ERROR] file doesn\'t exist');
        // }
        fileWriter.write(JSON.stringify(!configOdb ? this.configOdb$.value : configOdb));
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  }

  async accessToFile() {
    const fileConfig = 'OdbMetrics.json';

    const dirEntry: any = await this.file.resolveLocalFilesystemUrl(this.file.dataDirectory);
    return await new Promise((resolve, reject) => {
      dirEntry.getFile(fileConfig, {create: true, exclusive: false}, (fileEntry) => {
        resolve(fileEntry);
      }, (err) => {
        reject(err);
      });
    });
  }
}

import {Injectable} from '@angular/core';
import {File, FileEntry} from '@ionic-native/file/ngx';


@Injectable({
  providedIn: 'root'
})
export class ConfigOdbService {

  constructor(private file: File) {
  }

  globalconfig: any = {
    obdmetrics: [],
    dataUpload: {apikey: '', apisecret: '', localserver: '', mode: ''},
    bluetoothDeviceToUse: {address: '', devicename: ''},
    sendstatusinfo: false,
    dimscreenbrightness: 50
  };

  compareWithFn(o1, o2) {
    return o1 && o2 ? o1.name === o2.name : o1 === o2;
  }

  init(): void {
    this.read().then((data) => {
      if (data != null && typeof data === 'string' && data.length > 0){
        this.globalconfig = JSON.parse(data);
      }else{
        this.globalconfig = {
          obdmetrics: [],
          dataUpload: {apikey: '', apisecret: '', localserver: '', mode: ''},
          bluetoothDeviceToUse: {address: '', devicename: ''},
          sendstatusinfo: false,
          dimscreenbrightness: 50
        };
      }
    });
  }

  async read() {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onloadend = function() {
          console.log('Successful file read: ' + this.result);
          resolve(this.result);
          // displayFileData(fileEntry.fullPath + ": " + this.result);
        };
        reader.readAsText(file);
      }, (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  async save() {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.createWriter((fileWriter) => {
        // try {
        //   fileWriter.seek(fileWriter.length);
        // } catch (e) {
        //   console.log('[ERROR] file doesn\'t exist');
        // }
        fileWriter.write(JSON.stringify(this.globalconfig));
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

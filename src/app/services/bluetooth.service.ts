import {Injectable} from '@angular/core';
import {ConfigOdbService} from './config-odb.service';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {AlertController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {

  constructor(
    public configOdbService: ConfigOdbService,
    private bluetoothSerial: BluetoothSerial,
    private alertCtrl: AlertController) {
  }

  pairedList: PairedList[];
  listToggle = false;
  pairedDeviceID = 0;
  connstatus = '';

  init(): void {
    this.bluetoothSerial.isEnabled().then(success => {
      this.listPairedDevices();
    }, error => {
      this.showError('Пожалуйста включите Bluetooth');
    });
  }

  async showError(error) {
    const alert = await this.alertCtrl.create({
      message: error,
      subHeader: 'Ошибка',
      buttons: ['OK']
    });
    await alert.present();
  }

  listPairedDevices() {
    this.bluetoothSerial.list().then(success => {
      console.log('list bloo');
      console.log(success);
      this.pairedList = success;
      this.pairedList.forEach(item => item.isSelected = false);
      this.listToggle = true;
      console.log('Reading default device data: ' + this.configOdbService.globalconfig.bluetoothDeviceToUse.devicename);
      if (this.configOdbService.globalconfig.bluetoothDeviceToUse == null
        || this.configOdbService.globalconfig.bluetoothDeviceToUse.devicename === '') {
        return;
      }
      const i = this.pairedList.findIndex(item =>
        item.address === this.configOdbService.globalconfig.bluetoothDeviceToUse.address);
      if (i > -1) {
        this.pairedList[i].isSelected = true;
      }

    }, error => {
      this.showError('Пожалуйста включите Bluetooth');
      this.listToggle = false;
    });
  }

  selectBtDevice(ev) {
    if (ev.detail.value === null || ev.detail.value < 0) {
      return;
    }
    console.log('Changed BT device to use:' + this.pairedList[ev.detail.value].name);
    this.configOdbService.globalconfig.bluetoothDeviceToUse = {
      address: this.pairedList[ev.detail.value].address,
      devicename: this.pairedList[ev.detail.value].name
    };
    this.configOdbService.save();
  }

}


interface PairedList {
  class: number;
  id: string;
  address: string;
  name: string;
  isSelected: boolean;
}

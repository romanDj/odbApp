import {Injectable} from '@angular/core';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {AlertController} from '@ionic/angular';
import {BehaviorSubject} from 'rxjs';


export interface IPairedDevice {
  id: string;
  address: string;
  name: string;
}

export class PairedDevice implements IPairedDevice{
  address = '';
  id = '';
  name = '';
}


@Injectable({
  providedIn: 'root'
})
export class BluetoothService {

  private pairedList$: BehaviorSubject<PairedDevice[]> = new BehaviorSubject<PairedDevice[]>([]);
  readonly pairedList = this.pairedList$.asObservable();

  constructor(
    private bluetoothSerial: BluetoothSerial,
    private alertCtrl: AlertController) {
  }


  async init() {
    return await new Promise((resolve, reject) => {
      this.bluetoothSerial.isEnabled().then(success => {
        resolve();
      }, error => {
        reject();
        this.showError('Пожалуйста включите Bluetooth');
      });
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
      this.pairedList$.next(success ? success.map(x => ({
        id: x.id,
        address: x.address ? x.address : x.uuid,
        name: x.name
      })) : []);
    }, error => {
      this.showError('Пожалуйста включите Bluetooth');
    });
  }
}

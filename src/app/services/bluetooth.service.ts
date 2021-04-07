import {Injectable} from '@angular/core';
import {ConfigOdbService} from './config-odb.service';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {AlertController} from '@ionic/angular';
import {BehaviorSubject} from 'rxjs';


export interface PairedDevice {
  id: string;
  address: string;
  name: string;
}


@Injectable({
  providedIn: 'root'
})
export class BluetoothService {

  private pairedList$: BehaviorSubject<PairedDevice[]> = new BehaviorSubject<PairedDevice[]>([]);
  readonly pairedList = this.pairedList$.asObservable();

  constructor(
    private configOdbService: ConfigOdbService,
    private bluetoothSerial: BluetoothSerial,
    private alertCtrl: AlertController) {}


  init(): void {
    this.bluetoothSerial.isEnabled().then(success => {
      // this.listPairedDevices();
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

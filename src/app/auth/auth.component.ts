import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, FormBuilder, Validators} from '@angular/forms';
import {AlertController} from '@ionic/angular';
import {UserStoreService} from '../services/user-store.service';
import {HttpService} from '../services/api/http.service';
import {finalize, take} from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.component.html',
  styleUrls: ['auth.component.scss'],
})
export class AuthComponent implements OnInit {

  loginForm: FormGroup;
  isSending = false;

  constructor(private fb: FormBuilder,
              private alertCtrl: AlertController,
              private userStoreService: UserStoreService,
              private httpService: HttpService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.loginForm.markAsUntouched({onlySelf: false});
  }

  ionViewDidLeave() {

  }

  showAlert(title, message) {
    return new Promise((resolve, reject) => {
      this.alertCtrl.create({
        message,
        subHeader: title,
        buttons: ['OK']
      }).then(alert => alert.present().then(() => resolve()))
        .catch(() => reject());
    });
  }

  login() {
    this.isSending = true;
    const {username, password} = this.loginForm.value;
    this.httpService.authentication(username, password).pipe(
      take(1),
      finalize(() => {
        this.loginForm.patchValue({
          username: '',
          password: ''
        });
        this.loginForm.markAsUntouched({onlySelf: false});
        this.isSending = false;
      })
    ).subscribe(
      (response) => {
        this.showAlert('Авторизия', 'Вы успешно авторизировались');
      },
      (error) => {
        try {
          this.showAlert('Ошибка', `${error.error} \n ${error.error_description}`);
        } catch (e) {
          console.log(e);
        }
      }
    );
  }

  logout() {
    this.userStoreService.update(null);
  }

  testApiCall(){
    this.httpService.testApi().pipe(
      take(1),
      finalize(() => console.log('[TEST API] Finish'))
    ).subscribe();
  }
}

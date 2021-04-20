import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../services/auth.service';
import {AlertController} from '@ionic/angular';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.component.html',
  styleUrls: ['auth.component.scss'],
})
export class AuthComponent implements OnInit {

  loginForm: FormGroup;
  isSending = false;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private alertCtrl: AlertController) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.loginForm.markAsUntouched({onlySelf: false});
  }

  ionViewDidLeave(){

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
    this.authService.login(username, password).then((val) => {
      this.showAlert('Авторизия', 'Вы успешно авторизировались');
    }).catch((error) => {
      console.log(error);
      try {
        this.showAlert('Ошибка', `${error.error} \n ${error.error_description}`);
      } catch (e) {
        console.log(e);
      }
    }).finally(() => {
      this.loginForm.patchValue({
        username: '',
        password: ''
      });
      this.loginForm.markAsUntouched({onlySelf: false});
      this.isSending = false;
    });
  }
}

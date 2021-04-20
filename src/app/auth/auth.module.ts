import {IonicModule} from '@ionic/angular';
import {RouterModule} from '@angular/router';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthComponent} from './auth.component';
import {ExploreContainerComponentModule} from '../explore-container/explore-container.module';

import {IonContent} from '@ionic/angular/directives/proxies';
import {Tab2PageRoutingModule} from '../tab2/tab2-routing.module';
import {AuthComponentRoutingModule} from './auth-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    ExploreContainerComponentModule,
    AuthComponentRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [AuthComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthModule {
}

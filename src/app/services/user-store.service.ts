import {Injectable} from '@angular/core';
import {FileStoreJson} from '../utils/file-store-json';
import {File} from '@ionic-native/file/ngx';
import {BehaviorSubject} from 'rxjs';

export interface IUser {
  subject: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

export class User implements IUser {
  accessToken = '';
  name = '';
  refreshToken = '';
  subject = '';
}


@Injectable({
  providedIn: 'root'
})
export class UserStoreService {

  userStore: FileStoreJson = new FileStoreJson('UserStore', this.file);

  user$: BehaviorSubject<IUser> = new BehaviorSubject<IUser>(new User());
  user = this.user$.asObservable();

  constructor(private file: File) {}

  async init() {
    const data: any = await this.userStore.read();
    this.user$.next(data || new User());
  }

  async update(user: User | null) {
    if (user !== null) {
      await this.userStore.save(user);
      this.user$.next(user);
    } else {
      await this.userStore.save('');
      this.user$.next(new User());
    }
  }
}

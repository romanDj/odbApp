import { Injectable } from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';

export class EventData {
    name: string;
    value: any;

    constructor(name: string, value: any = null) {
      this.name = name;
      this.value = value;
    }
}


@Injectable({
  providedIn: 'root'
})
export class EventBusService {

  private subject$ = new Subject();

  constructor() { }


  /**
   * Example used:
   * this.eventBusService.emit(new EventData('someNameEvent', your_data));
   */
  emit(event: EventData){
    this.subject$.next(event);
  }

  /**
   * Example used:
   * this.eventBusService.on('someNameEvent', (data) => {
   *   your_need_actions
   * });
   */
  on(eventName: string, action: any): Subscription{
    return this.subject$.pipe(
      filter((e: EventData) => e.name === eventName),
      map((e: EventData) => e.value)
    ).subscribe(action);
  }
}

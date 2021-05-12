// tslint:disable-next-line:no-empty-interface
export interface ReceiveItemQ {
  ts: number;
  items: Array<{ name: string, value: string | number }>;
}


export class Queue {
  // tslint:disable-next-line:variable-name
  private _sendItems: Array<string> = [];
  // tslint:disable-next-line:variable-name
  private _receiveItems: Array<ReceiveItemQ> = [];

  get sendItems() {
    return this._sendItems;
  }

  get receiveItems() {
    return this._receiveItems;
  }

  addSendItem(item: any) {
    this._sendItems.push(item);
  }

  addReceiveItem(item: ReceiveItemQ) {
    this._receiveItems.push(item);
  }

  shiftSendItem() {
    return this._sendItems.shift();
  }

  editReceiveItem(name: string, value: string | number) {
    const firstField = this._receiveItems[0]?.items
      .find(x => x.name === name);
    if (firstField && firstField.value === '') {
      this._setFirstReceiveItem(name, value);

      const firstEmpty = this._receiveItems[0].items
        .find(x => x.value === '');
      if (!firstEmpty) {
        return this._receiveItems.shift();
      }
    } else if (firstField) {
      const first = this._receiveItems.shift();
      if (this._receiveItems[0]) {
        this._setFirstReceiveItem(name, value);
      }
      return first;
    }
  }

  private _setFirstReceiveItem(name: string, value: string | number) {
    this._receiveItems[0] = {
      ...this._receiveItems[0],
      items: this._receiveItems[0].items.map(x => {
        if (x.name === name) {
          return {...x, value};
        }
        return x;
      })
    };
  }

  clear() {
    this._sendItems = [];
    this._receiveItems = [];
  }
}

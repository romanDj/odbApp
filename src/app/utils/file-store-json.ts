import {File} from '@ionic-native/file/ngx';

export class FileStoreJson {
  constructor(private fileName: string, private file: File) {
  }

  async read() {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        const root = this;
        reader.onloadend = async function() {
          try {
            if (typeof this.result === 'string' && this.result.length > 0) {
              const data = JSON.parse(this.result);
              resolve(data);
            }else {
              throw new Error('');
            }
          } catch (e) {
            console.log('[ERROR] Read file ' + e);
            await root.save('');
            resolve(null);
          }
        };
        reader.readAsText(file);
      }, (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  async save(data: object | string) {
    const fileEntry: any = await this.accessToFile();
    return await new Promise((resolve, reject) => {
      fileEntry.createWriter((fileWriter) => {
        fileWriter.write(typeof data === 'string' ? '' : JSON.stringify(data));
        resolve();
      }, (err) => {
        reject(err);
      });
    });
  }

  async accessToFile() {
    const dirEntry: any = await this.file.resolveLocalFilesystemUrl(this.file.dataDirectory);
    return await new Promise((resolve, reject) => {
      dirEntry.getFile(this.fileName + '.json', {create: true, exclusive: false}, (fileEntry) => {
        resolve(fileEntry);
      }, (err) => {
        reject(err);
      });
    });
  }

}

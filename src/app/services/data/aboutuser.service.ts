import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { EarthstarDocPath, Keyword } from '../../model/schema';
import { generateRandomString } from '../../utils/generator';
import { StorageService } from '../storage.service';

@Injectable({
  providedIn: 'root'
})
export class AboutuserService {

  constructor(private authService:AuthService, private storageService:StorageService) {

  }

  async getDisplayName():Promise<string | null> {
    //following the Earthstar spec for storing display names - https://github.com/earthstar-project/application-formats/blob/main/formats/about/SPEC_1.0.md
    const path = '/about/1.0/~' + this.authService.esSettings.author.address + '/displayName'

    const doc = await this.storageService.replica.getLatestDocAtPath(path)
    if(Earthstar.isErr(doc)) {
      console.error('error getting DisplayName',doc);
      alert('error loading Display Name')
      return null
    }
    else {
      console.log('get DisplayName successful',doc)
      let displayName:string
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        displayName = doc.text
      }
      return displayName
    }
  }

  async saveDisplayName(displayName:string):Promise<EarthstarDocPath | null> {
    //following the Earthstar spec for storing display names - https://github.com/earthstar-project/application-formats/blob/main/formats/about/SPEC_1.0.md
    const path = '/about/1.0/~' + this.authService.esSettings.author.address + '/displayName'
    
    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: displayName,
      path: path,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving DisplayName',result);
      alert('ERROR SAVING DISPLAY NAME!')
      return null
    }
    else {
      console.log('DisplayName save successful',result)
      return result['doc']['path']
    }
  }

}

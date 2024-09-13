import { Injectable } from '@angular/core';
import * as Earthstar from 'earthstar';
import { BehaviorSubject } from 'rxjs';
import { generateRandomString } from '../utils/generator';
import { EarthstarProfile } from '../model/schema';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  esSettings = new Earthstar.SharedSettings()
  shareNamePrefix:string = 'delibcanvas'
  authConfigured:BehaviorSubject<boolean> = new BehaviorSubject(false)

  constructor() { 
    this.initAuthService()
  }

  initAuthService() {
    console.log('AuthService says',this.esSettings)

    if(this.esSettings.author && this.esSettings.shares?.length > 0) {
      this.authConfigured.next(true)
    }

    //if there is no existing Earthstar author (user) keypair in localStorage we generate one (this acts as the ID for the user)...
    if(!this.esSettings.author) {
      this.createAuthorCredentials()
    }

     //we check for an Earthstar "share", creating one if none already exist in localStorage...
    if(!this.esSettings.shares || this.esSettings.shares.length === 0) {
      this.createShare()
    }
  }

  async createAuthorCredentials() {
    console.log('no author - creating a new author')
      const result = await Earthstar.Crypto.generateAuthorKeypair(generateRandomString(4,true)); //name cannot begin with a number so we only use alphabet chars in our random string
      
      if(Earthstar.isErr(result)) {
        console.error(result);
        alert('ERROR CREATING USER!!!')
      }
      else {
        console.log(result)
        this.esSettings.author = result as Earthstar.AuthorKeypair
      }
  }

  updateAuthorCredentials(author:Earthstar.AuthorKeypair) {
    this.esSettings.author = author
  }

  async createShare() {
    console.log('no shares - creating a new share')
        const result = await Earthstar.Crypto.generateShareKeypair(this.shareNamePrefix) as Earthstar.ShareKeypair
        if(Earthstar.isErr(result)) {
          console.error(result);
          alert('ERROR SETTING UP DATA STORAGE! (could not create share)')
        }
        else {
          console.log(result)
          this.esSettings.addShare(result.shareAddress);
          const addShareSecretResult = await this.addShareSecret(result.shareAddress,result.secret)
          if(addShareSecretResult === 'error') {
            alert('ERROR SETTING UP DATA STORAGE! (no write access)')
          }
        }
  }

  async addShareSecret(shareAddress:string, shareSecret:string):Promise<string> {    
    const addSecretResult = await this.esSettings.addSecret(shareAddress, shareSecret);
    //if we weren't able to add a secret (which enables writing to the share) then we remove the share...
    if(Earthstar.isErr(addSecretResult)) {
      console.error('error adding share secret',addSecretResult);
      this.esSettings.removeShare(shareAddress)
      return 'error'
    }
    else {
      console.log('share secret added successfully')
      return 'success'
    }
  }

  async updateShares(shares:EarthstarProfile['shares'],overwriteExistingShares:boolean=false) {
    if(overwriteExistingShares && this.esSettings.shares?.length > 0) {
      this.esSettings.shares.forEach((share) => {
        const result = this.esSettings.removeShare(share)
        if(Earthstar.isErr(result)) {
          console.log('error removing share',result)
        }
        else {
          const removeSecretResult = this.esSettings.removeSecret(share)
          if(Earthstar.isErr(removeSecretResult)) {
            console.log('error removing share secret')
          }
        }
      })
      console.log('shares remaining: ',this.esSettings.shares)
    }

    for(const share of shares) {
      const result = this.esSettings.addShare(share.shareAddress)
      if(Earthstar.isErr(result)) {
        console.log('error adding share',result)
      }
      else {
        if(share.shareSecret) {
          const result = await this.esSettings.addSecret(share.shareAddress,share.shareSecret)
          if(Earthstar.isErr(result)) {
            console.error('error adding share secret',result);
          }
        }
      }      
    }
    console.log('current shares and share secrets: ',this.esSettings.shares, this.esSettings.shareSecrets)

  }

}

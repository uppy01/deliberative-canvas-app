import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as Earthstar from 'earthstar';
import { ReplicaDriverWeb } from "earthstar/browser";
import { EarthstarAuthorAddress, EarthstarProfile, FieldMapping } from './data/schema';
import { SyncService } from './sync.service';
import { AboutuserService } from './data/aboutuser.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  appName:string = 'delibcanvas'
  remoteFieldMappingURL:string = 'https://raw.githubusercontent.com/uppy01/deliberative-canvas-config/main/fieldmapping.json'
  
  authConfigSubscription:Subscription
  //replica:Earthstar.Replica
  user:EarthstarAuthorAddress
  userDisplayName:string = ''

  userProfile:EarthstarProfile

  constructor(private authService:AuthService, private storageService:StorageService, private aboutUserService:AboutuserService, private syncService:SyncService) {
    this.initAppService()
  }

  initAppService() {
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.getDisplayName()
        this.syncService.configureSync(this.storageService.replica)
      }
    })
    
    this.authConfigSubscription = this.authService.authConfigured.subscribe((configured) => {
      if(configured) {
        this.user = this.authService.esSettings.author.address
        this.storageService.configureStorage()
        this.authConfigSubscription?.unsubscribe()
      }
    })

    this.authService.esSettings.onAuthorChanged((author) => {
      console.log('onAuthorChanged')
      this.user = this.authService.esSettings.author.address
    })
    
    this.authService.esSettings.onSharesChanged((shares) => {
      console.log('onSharesChanged')
      this.storageService.configureStorage()
    })

    this.authService.esSettings.onShareSecretsChanged((secrets) => {
      console.log('onShareSecretsChanged')
      this.storageService.configureStorage()
    })
  }

  async getDisplayName() {
    this.userDisplayName = await this.aboutUserService.getDisplayName()
  }

  /* configureStorage() {
    //make sure we have at least one share available...
    if(this.authService.esSettings.shares[0]) {
      this.replica = new Earthstar.Replica({
        driver: new ReplicaDriverWeb(this.authService.esSettings.shares[0]),
        shareSecret: this.authService.esSettings.shareSecrets[this.authService.esSettings.shares[0]]
      })
      console.log('replica:',this.replica)
      if(this.replica) {
        this.getDisplayName()
        this.storageConfigured.next(true)
        this.syncService.configureSync(this.replica)
      }
    }
  } */
}

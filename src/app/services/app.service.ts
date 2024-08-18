import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as Earthstar from 'earthstar';
import { ReplicaDriverWeb } from "earthstar/browser";
import { EarthstarAuthorAddress, EarthstarProfile, FieldMapping } from './data/data-types';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  appName:string = 'delibcanvas'
  remoteFieldMappingURL:string = 'https://raw.githubusercontent.com/uppy01/deliberative-canvas-config/main/fieldmapping.json'
  
  authConfigSubscription:Subscription
  replica:Earthstar.Replica
  user:EarthstarAuthorAddress
  storageConfigured:BehaviorSubject<boolean> = new BehaviorSubject(false)

  userProfile:EarthstarProfile

  constructor(private authService:AuthService, private syncService:SyncService) {
    this.initAppService()
  }

  initAppService() {
    this.authConfigSubscription = this.authService.authConfigured.subscribe((configured) => {
      if(configured) {
        this.user = this.authService.esSettings.author.address
        this.configureStorage()
        this.authConfigSubscription?.unsubscribe()
      }
    })

    this.authService.esSettings.onAuthorChanged((author) => {
      console.log('onAuthorChanged')
      this.user = this.authService.esSettings.author.address
    })
    
    this.authService.esSettings.onSharesChanged((shares) => {
      console.log('onSharesChanged')
      this.configureStorage()
    })

    this.authService.esSettings.onShareSecretsChanged((secrets) => {
      console.log('onShareSecretsChanged')
      this.configureStorage()
    })
  }

  configureStorage() {
    //make sure we have at least one share available...
    if(this.authService.esSettings.shares[0]) {
      this.replica = new Earthstar.Replica({
        driver: new ReplicaDriverWeb(this.authService.esSettings.shares[0]),
        shareSecret: this.authService.esSettings.shareSecrets[this.authService.esSettings.shares[0]]
      })
      console.log('replica:',this.replica)
      if(this.replica) this.storageConfigured.next(true)
      
      this.syncService.configureSync(this.replica)
    }
  }
}

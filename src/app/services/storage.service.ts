import { Injectable } from '@angular/core';
import * as Earthstar from 'earthstar'
import { AuthService } from './auth.service';
import { ReplicaDriverWeb } from 'earthstar/browser';
import { BehaviorSubject } from 'rxjs';
import { SyncService } from './sync.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  replica:Earthstar.Replica
  storageConfigured:BehaviorSubject<boolean> = new BehaviorSubject(false)

  constructor(private authService:AuthService) { 

  }

  configureStorage() {
    //make sure we have at least one share available...
    if(this.authService.esSettings.shares[0]) {
      this.replica = new Earthstar.Replica({
        driver: new ReplicaDriverWeb(this.authService.esSettings.shares[0]),
        shareSecret: this.authService.esSettings.shareSecrets[this.authService.esSettings.shares[0]]
      })
      console.log('replica:',this.replica)
      if(this.replica) {
        this.storageConfigured.next(true)
      }
    }
  }

}

import { Injectable } from '@angular/core';
import * as Earthstar from 'earthstar';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  syncServerURL:string = ''
  peer:Earthstar.Peer
  syncInProgress:boolean = false
  syncCompletedSuccessfully:BehaviorSubject<boolean> = new BehaviorSubject(false)


  constructor(private authService:AuthService) { 
    this.syncServerURL = this.authService.esSettings.servers[0] ? this.authService.esSettings.servers[0] : ''
  }

  async configureSync(replica:Earthstar.Replica) {
    this.peer = new Earthstar.Peer();
    await this.peer.addReplica(replica);
    this.doSync()
  }

  doSync() {
    if(this.syncServerURL && this.syncServerURL !== '') {
      this.syncInProgress = true
      const syncer = this.peer.sync(this.syncServerURL,false);
      syncer.onStatusChange((newStatus) => {
          console.log('new sync status:',newStatus);
        });
      
      syncer.isDone()
      .then(() => {
          console.log("Sync complete");
          this.syncInProgress = false
          this.syncCompletedSuccessfully.next(true)
        })
      .catch((err) => {
          console.error("Sync failed", err);
          this.syncInProgress = false
          alert('Sync failed!!! \n\n (you may need to have your "Share ID" added to the sync server)')
        });
    }
  }

  addSyncServer(url?:string) {
    if(this.authService.esSettings.servers?.length > 0) {
      //remove all existing servers as we only want a max of 1 server (the new server about to be added)
      for(let server of this.authService.esSettings.servers) {
        this.authService.esSettings.removeServer(server)
      }
    }

    const result = this.authService.esSettings.addServer(url ? url : this.syncServerURL)
      if(Earthstar.isErr(result)) {
        console.error('error adding sync server',result);
        alert('error adding sync server')
      }
      else {
        if(url) this.syncServerURL = url
        this.doSync()
      }
  }

  removeSyncServer(url?:string) {
    const result = this.authService.esSettings.removeServer(url ? url : this.syncServerURL)
    if(Earthstar.isErr(result)) {
      console.error('error removing sync server',result);
      alert('error removing sync server')
    }
    else {
      this.syncServerURL = ''
    }
  }

}

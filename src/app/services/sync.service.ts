import { Injectable } from '@angular/core';
import * as Earthstar from 'earthstar';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  syncServerURL:string = 'https://delib-canvas.wf-apps.net'
  peer:Earthstar.Peer

  constructor() { }

  async configureSync(replica:Earthstar.Replica) {
    this.peer = new Earthstar.Peer();
    await this.peer.addReplica(replica);
    this.doSync()
  }

  doSync() {
    const syncer = this.peer.sync(this.syncServerURL,false);
    syncer.onStatusChange((newStatus) => {
        console.log('new sync status:',newStatus);
      });
    
    syncer.isDone()
    .then(() => {
        console.log("Sync complete");
      })
    .catch((err) => {
        console.error("Sync failed", err);
        alert('error - sync failed!')
      });
  }

}

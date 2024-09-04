import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { EarthstarDocPath, CanvasView } from './schema';
import { generateRandomString, generateSlugString } from '../../utils/generator';
import { StorageService } from '../storage.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasviewService {

  schemaName:string = 'canvasview'
  schemaVersion:string = '1.0'
  schemaPath:string


  constructor(private appService:AppService, private authService:AuthService, private storageService:StorageService) {
    this.schemaPath = `/${this.appService.appName}/${this.schemaName}/${this.schemaVersion}/`
  }

  async getCanvasView(id:EarthstarDocPath):Promise<CanvasView | null> {
    /**
     NOTE: whilst CanvasView does have a 'fileData' property (to hold an Earthstar attachment) we are currently not retrieving it here because we do not need to use it in the app...the attachment is only for Earthstar server requests
    */

    const doc = await this.storageService.replica.getLatestDocAtPath(id)
    if(Earthstar.isErr(doc)) {
      console.error('error getting CanvasView',doc);
      return null
    }
    else {
      console.log('get CanvasView successful',doc)
      let canvasView:CanvasView
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        canvasView = JSON.parse(doc.text)
        canvasView.dateCreated = new Date(canvasView.dateCreated)
        canvasView.dateUpdated = new Date(canvasView.dateUpdated)
      }
      return canvasView
    }
  }

  /**
   * only returns CanvasView's for this class' specified schemaVersion - those saved under a different schema version will not be returned
   */
  async getCanvasViews():Promise<CanvasView[] | null> {
    /**
     NOTE: whilst CanvasView does have a 'fileData' property (to hold an Earthstar attachment) we are currently not retrieving it here because we do not need to use it in the app...the attachment is only for Earthstar server requests
    */

    const docs = await this.storageService.replica.queryDocs({
      filter: { pathStartsWith: this.schemaPath }
    }) 
    if(Earthstar.isErr(docs)) {
      console.error('error getting all CanvasViews',docs);
      return null
    }
    else {
      console.log('get all CanvasViews successful',docs)
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      let canvasViews:CanvasView[] = docs.filter((doc) => doc.text?.length > 0).map((doc) => JSON.parse(doc.text))
      canvasViews.forEach((canvasView) => {
        canvasView.dateCreated = new Date(canvasView.dateCreated)
        canvasView.dateUpdated = new Date(canvasView.dateUpdated)
      })
      
      return canvasViews
    }
  }

  async getCanvasViewsByExportLog(exportLogID:EarthstarDocPath):Promise<CanvasView[] | null> {
    let canvasViews = await this.getCanvasViews()
    if(canvasViews && canvasViews.length > 0) {
      canvasViews = canvasViews.filter((canvasView) => canvasView.exportLogIDs.some((id) => id === exportLogID))
    }

    return canvasViews
  }

  async saveCanvasView(canvasView:CanvasView):Promise<EarthstarDocPath | null> {
    const buffer = await canvasView.fileData.arrayBuffer()
    const attachmentData = new Uint8Array(buffer)
    const attachmentNameSlug = generateSlugString(canvasView.title)
    const attachmentExtension = canvasView.fileExtension

    //now we have the raw attachment data we can remove the 'fileData' blob so that the remaining fields can be saved to Earthstar doc's 'text' property without blowing the 8KB size limit...
    canvasView.fileData = null
    
    //if we are creating a new CanvasView then we assign an id, dateCreated and createdBy...
    if(!canvasView.id) {
      //we append attachment extension to the path to enable compatibility with Earthstar Server...
      canvasView.id = `${this.schemaPath}${Date.now()}_${attachmentNameSlug}.${attachmentExtension}`
      canvasView.dateCreated = Date.now()
      canvasView.createdBy = this.appService.user
    }
    else {
      //convert the dateCreated (back) to milliseconds before saving...
      canvasView.dateCreated = new Date(canvasView.dateCreated).getTime()
    }
    canvasView.dateUpdated = Date.now()
    canvasView.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(canvasView),
      attachment: attachmentData,
      path: canvasView.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving CanvasView',result);
      return null
    }
    else {
      console.log('CanvasView save successful',result)
      return result['doc']['path']
    }
  }

  async saveCanvasViewAttachmentOnly(canvasView:CanvasView):Promise<EarthstarDocPath | null> {
    const buffer = await canvasView.fileData.arrayBuffer()
    const attachmentData = new Uint8Array(buffer)

    //we retrieve the current doc so that we can copy the 'text' property, without modifying, on the proceeding write to replica...
    const doc = await this.storageService.replica.getLatestDocAtPath(canvasView.id)

    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: doc.text,
      attachment: attachmentData,
      path: canvasView.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving CanvasView (Attachment Only)',result);
      return null
    }
    else {
      console.log('CanvasView (Attachment Only) save successful',result)
      return result['doc']['path']
    }
  }

  /**
   * saves the canvasView without mutating 'dateUpdated', 'updatedBy' or any attachment data
   */
  async cascadeSaveCanvasView(canvasView:CanvasView):Promise<EarthstarDocPath | null> {

    //make sure fileData is nulled before saving...
    canvasView.fileData = null

    //convert dates (back) to milliseconds before saving...(note we don't change their value)
    canvasView.dateCreated = (canvasView.dateCreated as Date).getTime()
    canvasView.dateUpdated = (canvasView.dateUpdated as Date).getTime()

    // Write to the replica...
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(canvasView),
      path: canvasView.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving CanvasView (RemoveExportLogIDOnly)',result);
      return null
    }
    else {
      console.log('CanvasView save successful (RemoveExportLogIDOnly)',result)
      return result['doc']['path']
    }

  }

  async deleteCanvasView(id:EarthstarDocPath) {
    const result = await this.storageService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting CanvasView',result);
      return null
    }
    else {
      console.log('CanvasView delete successful',result)
      return result
    }
  }

}

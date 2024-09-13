import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { generateSlugString } from '../../utils/generator';
import { EarthstarDocPath, ExportLog } from '../../model/schema';
import { StorageService } from '../storage.service';
import { SchemaService } from './schema.service';

@Injectable({
  providedIn: 'root'
})
export class ExportlogService {

  schemaName:string = 'exportlog'
  schemaVersion:string = '1.0'
  schemaPath:string
  

  constructor(private appService:AppService, private authService:AuthService, private storageService:StorageService, private schemaService:SchemaService) {
    this.schemaPath = `/${this.appService.appName}/${this.schemaName}/${this.schemaVersion}/`
  }

  async getExportLog(id:EarthstarDocPath):Promise<any> {
    const doc = await this.storageService.replica.getLatestDocAtPath(id)
    if(Earthstar.isErr(doc)) {
      console.error('error getting ExportLog',doc);
      alert('error loading export data')
      return
    }
    else {
      console.log('get ExportLog successful',doc)

      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        let exportLog:ExportLog = JSON.parse(doc.text)
        exportLog.dateCreated = new Date(exportLog.dateCreated)
        exportLog.dateUpdated = new Date(exportLog.dateUpdated)

        const attachment = await this.storageService.replica.getAttachment(doc)
        if(Earthstar.isErr(attachment)) {
          console.error('error getting ExportLog attachment',attachment);
          alert('error loading exported file')
          return
        }
        else {
          if(attachment) {
            console.log('get ExportLog attachment successful',attachment)
            const attachmentBytes = await attachment.bytes()
            const attachmentBuffer = attachmentBytes.buffer
            exportLog.fileData = new Blob([attachmentBuffer],{type:`text/${exportLog.fileExtension}`})
          }
          return exportLog
        }
      }
    }
  }

  /**
   * only returns ExportLog's for this class' specified schemaVersion - those saved under a different schema version will not be returned
   */
  async getExportLogs():Promise<any> {
    /**
     * NOTE: we are not getting attachments...they should be retrieved on a per doc basis through "getExportLog(id)"
     */
    
    const docs = await this.storageService.replica.queryDocs({
      filter: { pathStartsWith: this.schemaPath }
    }) 
    if(Earthstar.isErr(docs)) {
      console.error('error getting ExportLogs',docs);
      alert('error loading previous exports')
      return
    }
    else {
      console.log('get ExportLogs successful',docs)
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      let exportLogs:ExportLog[] = docs.filter((doc) => doc.text?.length > 0).map((doc) => JSON.parse(doc.text))
      exportLogs.forEach((exportLog) => {
        exportLog.dateCreated = new Date(exportLog.dateCreated)
        exportLog.dateUpdated = new Date(exportLog.dateUpdated)
      })
      
      return exportLogs
    }
  }

  async saveExportLog(exportLog:ExportLog):Promise<EarthstarDocPath | null> {
    const buffer = await exportLog.fileData.arrayBuffer()
    const attachmentData = new Uint8Array(buffer)
    const attachmentNameSlug = generateSlugString(exportLog.fileName)
    const attachmentExtension = exportLog.fileExtension

    //now we have the raw attachment data we can remove the 'fileData' blob from exportLog so that the remaining fields can be saved to Earthstar doc's 'text' property without blowing the 8KB size limit...
    exportLog.fileData = null
    
    //if we are creating a new exportLog then we assign an id, dateCreated and createdBy...
    const createNew:boolean = !exportLog.id
    if(createNew) {
      exportLog.id = `${this.schemaPath}${Date.now()}_${attachmentNameSlug}.${attachmentExtension}`
      exportLog.dateCreated = Date.now()
      exportLog.createdBy = this.appService.user
    }
    else {
      //convert the dateCreated (back) to milliseconds before saving...
      exportLog.dateCreated = (exportLog.dateCreated as Date).getTime()
    }
    exportLog.dateUpdated = Date.now()
    exportLog.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(exportLog),
      attachment: attachmentData,
      path: exportLog.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving ExportLog',result);
      alert('ERROR SAVING DATA!!! (EXPORTLOG)')
      return null
    }
    else {
      console.log('ExportLog save successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation: createNew ? 'CREATE' : 'UPDATE',id:result['doc']['path']})
      return result['doc']['path']
    }
  }

  async deleteExportLog(id:EarthstarDocPath):Promise<any> {
    const result = await this.storageService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting ExportLog',result);
      alert('ERROR DELETING!')
      return null
    }
    else {
      console.log('ExportLog delete successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation:'DELETE',id:id})
      return result
    }
  }

  /**
   * saves the exportLog without mutating 'dateUpdated', 'updatedBy' or any attachment data
   */
  async cascadeSaveExportLog(exportLog:ExportLog):Promise<EarthstarDocPath | null> {
    
    //make sure fileData is null...
    exportLog.fileData = null

    //convert dates (back) to milliseconds before saving...(note we don't change their value)
    exportLog.dateCreated = (exportLog.dateCreated as Date).getTime()
    exportLog.dateUpdated = (exportLog.dateUpdated as Date).getTime()

    // Write to the replica...
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(exportLog),
      path: exportLog.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error CASCADE saving ExportLog',result);
      return null
    }
    else {
      console.log('ExportLog CASCADE save successful',result)
      return result['doc']['path']
    }
    
  }

}

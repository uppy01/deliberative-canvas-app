import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { generateSlugString } from '../../utils/generator';
import { EarthstarDocPath, ExportLog } from './data-types';

@Injectable({
  providedIn: 'root'
})
export class ExportlogService {

  constructor(private appService:AppService, private authService:AuthService) { }

  async getExportLog(id:EarthstarDocPath):Promise<any> {
    const doc = await this.appService.replica.getLatestDocAtPath(id)
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

        const attachment = await this.appService.replica.getAttachment(doc)
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

  async getExportLogs():Promise<any> {
    const docs = await this.appService.replica.queryDocs({
      filter: { pathStartsWith: `/${this.appService.appName}/exportlog/` }
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

  async saveExportLog(exportLog:ExportLog):Promise<any> {
    const buffer = await exportLog.fileData.arrayBuffer()
    const attachmentData = new Uint8Array(buffer)
    const attachmentNameSlug = generateSlugString(exportLog.fileName)
    const attachmentExtension = exportLog.fileExtension

    //now we have the raw attachment data we can remove the 'fileData' blob from exportLog so that the remaining fields can be saved to Earthstar doc's 'text' property without blowing the 8KB size limit...
    exportLog.fileData = null
    
    //if we are creating a new exportLog then we assign an id, dateCreated and createdBy...
    if(!exportLog.id) {
      exportLog.id = `/${this.appService.appName}/exportlog/${Date.now()}_${attachmentNameSlug}.${attachmentExtension}`
      exportLog.dateCreated = Date.now()
      exportLog.createdBy = this.appService.user
    }
    exportLog.dateUpdated = Date.now()
    exportLog.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.appService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(exportLog),
      attachment: attachmentData,
      path: exportLog.id,
    });
    
    if(Earthstar.isErr(result)) {
        console.error('error saving ExportLog',result);
        alert('ERROR SAVING DATA!!! (EXPORTLOG)')
        return
    }
    else {
      console.log('ExportLog save successful',result)
      return result
    }
  }

  async deleteExportLog(id:EarthstarDocPath):Promise<any> {
    const result = await this.appService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting ExportLog',result);
      alert('ERROR DELETING!')
      return null
    }
    else {
      console.log('ExportLog delete successful',result)
      return result
    }
  }

}

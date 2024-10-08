import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { EarthstarDocPath, Deliberation } from '../../model/schema';
import { generateRandomString } from '../../utils/generator';
import { StorageService } from '../storage.service';
import { SchemaService } from './schema.service';

@Injectable({
  providedIn: 'root'
})
export class DeliberationService {

  schemaName:string = 'deliberation'
  schemaVersion:string = '1.0'
  schemaPath:string


  constructor(private appService:AppService, private authService:AuthService, private storageService:StorageService, private schemaService:SchemaService) {
    this.schemaPath = `/${this.appService.appName}/${this.schemaName}/${this.schemaVersion}/`
  }

  async getDeliberation(id:EarthstarDocPath):Promise<Deliberation | null> {
    const doc = await this.storageService.replica.getLatestDocAtPath(id)
    if(Earthstar.isErr(doc)) {
      console.error('error getting Deliberation',doc);
      return null
    }
    else {
      console.log('get Deliberation successful',doc)
      let deliberation:Deliberation
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        deliberation = JSON.parse(doc.text)
        deliberation.dateCreated = new Date(deliberation.dateCreated)
        deliberation.dateUpdated = new Date(deliberation.dateUpdated)
      }
      return deliberation
    }
  }

  /**
   * only returns Deliberation's for this class' specified schemaVersion - those saved under a different schema version will not be returned
   */
  async getDeliberations():Promise<Deliberation[] | null> {
    const docs = await this.storageService.replica.queryDocs({
      filter: { pathStartsWith: this.schemaPath }
    }) 
    if(Earthstar.isErr(docs)) {
      console.error('error getting all Deliberations',docs);
      return null
    }
    else {
      console.log('get all Deliberations successful',docs)
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      let deliberations:Deliberation[] = docs.filter((doc) => doc.text?.length > 0).map((doc) => JSON.parse(doc.text))
      deliberations.forEach((deliberation) => {
        deliberation.dateCreated = new Date(deliberation.dateCreated)
        deliberation.dateUpdated = new Date(deliberation.dateUpdated)
      })
      
      return deliberations
    }
  }

  async saveDeliberation(deliberation:Deliberation):Promise<EarthstarDocPath | null> {
    //if we are creating a new Deliberation then we assign an id, dateCreated and createdBy...
    const createNew:boolean = !deliberation.id
    if(createNew) {
      //we append a 4-character random string to the current time to ensure a unique id (path)
      deliberation.id = `${this.schemaPath}${Date.now()}__${generateRandomString(4)}`
      deliberation.dateCreated = Date.now()
      deliberation.createdBy = this.appService.user
    }
    else {
      //convert the dateCreated (back) to milliseconds before saving...
      deliberation.dateCreated = new Date(deliberation.dateCreated).getTime()
    }
    deliberation.dateUpdated = Date.now()
    deliberation.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(deliberation),
      path: deliberation.id,
    });
    
    if(Earthstar.isErr(result)) {
      console.error('error saving Deliberation',result);
      return null
    }
    else {
      console.log('Deliberation save successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation: createNew ? 'CREATE' : 'UPDATE',id:result['doc']['path']})
      return result['doc']['path']
    }
  }

  async deleteDeliberation(id:EarthstarDocPath) {
    const result = await this.storageService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting Deliberation',result);
      return null
    }
    else {
      console.log('Deliberation delete successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation:'DELETE',id:id})
      return result
    }
  }

}

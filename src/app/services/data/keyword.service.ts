import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { EarthstarDocPath, Keyword } from './data-types';
import { generateRandomString } from '../../utils/generator';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {

  constructor(private appService:AppService, private authService:AuthService) {

  }

  async getKeyword(id:EarthstarDocPath):Promise<Keyword | null> {
    const doc = await this.appService.replica.getLatestDocAtPath(id)
    if(Earthstar.isErr(doc)) {
      console.error('error getting Keyword',doc);
      alert('error loading keyword')
      return null
    }
    else {
      console.log('get Keyword successful',doc)
      let keyword:Keyword
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        keyword = JSON.parse(doc.text)
        keyword.dateCreated = new Date(keyword.dateCreated)
        keyword.dateUpdated = new Date(keyword.dateUpdated)
      }
      return keyword
    }
  }

  async getKeywords():Promise<Keyword[] | null> {
    const docs = await this.appService.replica.queryDocs({
      filter: { pathStartsWith: `/${this.appService.appName}/keyword/` }
    }) 
    if(Earthstar.isErr(docs)) {
      console.error('error getting all Keywords',docs);
      alert('error loading keywords')
      return null
    }
    else {
      console.log('get all Keywords successful',docs)
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      let keywords:Keyword[] = docs.filter((doc) => doc.text?.length > 0).map((doc) => JSON.parse(doc.text))
      keywords.forEach((keyword) => {
        keyword.dateCreated = new Date(keyword.dateCreated)
        keyword.dateUpdated = new Date(keyword.dateUpdated)
      })
      
      return keywords
    }
  }

  async saveKeyword(keyword:Keyword):Promise<any> {
    //if we are creating a new Keyword then we assign an id, dateCreated and createdBy...
    if(!keyword.id) {
      //we append a 4-character random string to the current time to ensure a unique id (path)
      keyword.id = `/${this.appService.appName}/keyword/${Date.now()}__${generateRandomString(4)}`
      keyword.dateCreated = Date.now()
      keyword.createdBy = this.appService.user
    }
    keyword.dateUpdated = Date.now()
    keyword.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.appService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(keyword),
      path: keyword.id,
    });
    
    if(Earthstar.isErr(result)) {
        console.error('error saving Keyword',result);
        alert('ERROR SAVING KEYWORD!')
        return null
    }
    else {
      console.log('Keyword save successful',result)
      return result
    }
  }

  async deleteKeyword(id:EarthstarDocPath) {
    const result = await this.appService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting Keyword',result);
      alert('ERROR DELETING KEYWORD!')
      return null
    }
    else {
      console.log('Keyword delete successful',result)
      return result
    }
  }

}

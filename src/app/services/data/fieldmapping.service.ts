import { Injectable } from '@angular/core';
import { AppService } from '../app.service';
import { AuthService } from '../auth.service';
import * as Earthstar from 'earthstar';
import { EarthstarDocPath, FieldMapping } from './schema';
import { generateRandomString } from '../../utils/generator';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '../storage.service';
import * as _ from 'lodash';
import { SchemaService } from './schema.service';

@Injectable({
  providedIn: 'root'
})
export class FieldmappingService {

  schemaName:string = 'fieldmapping'
  schemaVersion:string = '1.0'
  schemaPath:string

  fieldMappingServiceReady:BehaviorSubject<boolean> = new BehaviorSubject(false)


  constructor(private appService:AppService, private authService:AuthService, private storageService:StorageService, private schemaService:SchemaService) {
    this.schemaPath = `/${this.appService.appName}/${this.schemaName}/${this.schemaVersion}/`
    
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.fetchRemoteFieldMappings()
      }
    })
  }

  async getFieldMapping(id:EarthstarDocPath):Promise<FieldMapping | null> {
    const doc = await this.storageService.replica.getLatestDocAtPath(id)
    if(Earthstar.isErr(doc)) {
      console.error('error getting FieldMapping',doc);
      alert('error loading field mapping - exporting may not work')
      return null
    }
    else {
      console.log('get FieldMapping successful',doc)
      let fieldMapping:FieldMapping
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      if(doc?.text?.length > 0) {
        fieldMapping = JSON.parse(doc.text)
        fieldMapping.dateCreated = new Date(fieldMapping.dateCreated)
        fieldMapping.dateUpdated = new Date(fieldMapping.dateUpdated)
      }
      return fieldMapping
    }
  }

  /**
   * only returns FieldMapping's for this class' specified schemaVersion - those saved under a different schema version will not be returned
   */
  async getFieldMappings():Promise<FieldMapping[] | null> {
    const docs = await this.storageService.replica.queryDocs({
      filter: { pathStartsWith: this.schemaPath }
    }) 
    if(Earthstar.isErr(docs)) {
      console.error('error getting all FieldMappings',docs);
      alert('error loading field mappings - exporting may not work')
      return null
    }
    else {
      console.log('get all FieldMappings successful',docs)
      //doc.text of null/zero length signifies a tombstone (deleted) doc
      let fieldMappings:FieldMapping[] = docs.filter((doc) => doc.text?.length > 0).map((doc) => JSON.parse(doc.text))
      fieldMappings.forEach((fieldMapping) => {
        fieldMapping.dateCreated = new Date(fieldMapping.dateCreated)
        fieldMapping.dateUpdated = new Date(fieldMapping.dateUpdated)
      })
      
      return fieldMappings
    }
  }

  async saveFieldMapping(fieldMapping:FieldMapping):Promise<EarthstarDocPath | null> {
    //if we are creating a new FieldMapping then we assign an id, dateCreated and createdBy...
    const createNew:boolean = !fieldMapping.id
    if(createNew) {
      //we append a 4-character random string to the current time to ensure a unique id (path)
      fieldMapping.id = `${this.schemaPath}${Date.now()}__${generateRandomString(4)}`
      fieldMapping.dateCreated = Date.now()
      fieldMapping.createdBy = this.appService.user
    }
    else {
      //convert the dateCreated (back) to milliseconds before saving...
      fieldMapping.dateCreated = new Date(fieldMapping.dateCreated).getTime()
    }
    fieldMapping.dateUpdated = Date.now()
    fieldMapping.updatedBy = this.appService.user
    
    // Write to the replica.
    const result = await this.storageService.replica.set(this.authService.esSettings.author, {
      text: JSON.stringify(fieldMapping),
      path: fieldMapping.id,
    });
    
    if(Earthstar.isErr(result)) {
        console.error('error saving FieldMapping',result);
        alert('ERROR SAVING FIELD MAPPING!')
        return null
    }
    else {
      console.log('FieldMapping save successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation: createNew ? 'CREATE' : 'UPDATE',id:result['doc']['path']})
      return result['doc']['path']
    }
  }

  async deleteFieldMapping(id:EarthstarDocPath) {
    const result = await this.storageService.replica.wipeDocAtPath(this.authService.esSettings.author,id)
    if(Earthstar.isErr(result)) {
      console.error('error deleting FieldMapping',result);
      alert('ERROR DELETING!')
      return null
    }
    else {
      console.log('FieldMapping delete successful',result)
      this.schemaService.mutationEvent.next({schemaName:this.schemaName,operation:'DELETE',id:id})
      return result
    }
  }

  private async fetchRemoteFieldMappings() {
    try {
      const fetchResult = await fetch(new URL(this.appService.remoteFieldMappingURL))
      const remoteFieldMappings:FieldMapping[] = await fetchResult.json()
      console.log('remoteFieldMappings: ',remoteFieldMappings)
      
      if(remoteFieldMappings && remoteFieldMappings.length > 0) {
        for(let remoteFieldMapping of remoteFieldMappings) {
          //prepend the remote id with the current schemaPath before looking for it in storage
          remoteFieldMapping.id = this.schemaPath + remoteFieldMapping.id
          const existingCoreFieldMapping = await this.getFieldMapping(remoteFieldMapping.id)
          
          if(existingCoreFieldMapping) {
            //if the sourceName or fields (object) are different in existing v remote, then update, otherwise do nothing
            if(existingCoreFieldMapping.sourceName !== remoteFieldMapping.sourceName || !_.isEqual(existingCoreFieldMapping.fields, remoteFieldMapping.fields)) {
              existingCoreFieldMapping.sourceName = remoteFieldMapping.sourceName
              existingCoreFieldMapping.fields = remoteFieldMapping.fields
              
              console.log(`core fieldMapping '${existingCoreFieldMapping.sourceName}' being updated`)
              await this.saveFieldMapping(existingCoreFieldMapping)
            }
          }
          else {
            const newCoreFieldMapping:FieldMapping = {
              id: remoteFieldMapping.id,
              sourceName: remoteFieldMapping.sourceName,
              isCoreSource: true,
              fields: remoteFieldMapping.fields,
              dateCreated: Date.now(),
              createdBy: this.appService.user
            }
            console.log(`core fieldMapping '${newCoreFieldMapping.sourceName}' being created`)
            await this.saveFieldMapping(newCoreFieldMapping)
          }
          
        }
        this.fieldMappingServiceReady.next(true)
        
        //await this.mergeFieldMappings(remoteFieldMappings)
      }
      else {
        console.log('problem parsing remote field mappings')
        this.fieldMappingServiceReady.next(true)
      }
    }
    catch(e) {
      console.log('error fetching remote field mappings',e)
      this.fieldMappingServiceReady.next(true)
    }
    
  }

  private async mergeFieldMappings(remoteFieldMappings:FieldMapping[]) {
    const localFieldMappings:FieldMapping[] = await this.getFieldMappings()
    console.log(localFieldMappings)

    for(const remoteFieldMapping of remoteFieldMappings) {
      if(localFieldMappings && localFieldMappings.length > 0) {
        const foundLocalFieldMapping = localFieldMappings.find((localFieldMapping) => localFieldMapping.sourceName === remoteFieldMapping.sourceName)
        if(foundLocalFieldMapping) {
          const mergedFields = this.mergeFields(foundLocalFieldMapping.fields,remoteFieldMapping.fields)
          const updatedFieldMapping:FieldMapping = {
            id:foundLocalFieldMapping.id,
            sourceName: foundLocalFieldMapping.sourceName,
            isCoreSource: true,
            fields: mergedFields
          }
          const updateResult = await this.saveFieldMapping(updatedFieldMapping)
          console.log(updateResult)
        }
        else {
          const newFieldMapping:FieldMapping = {
            sourceName: remoteFieldMapping.sourceName,
            isCoreSource: true,
            fields: remoteFieldMapping.fields
          }
          const newResult = await this.saveFieldMapping(newFieldMapping)
          console.log(newResult)
        }
      }
      else {
        const newFieldMapping:FieldMapping = {
          sourceName: remoteFieldMapping.sourceName,
          isCoreSource: true,
          fields: remoteFieldMapping.fields
        }
        const newResult = await this.saveFieldMapping(newFieldMapping)
        console.log(newResult)
      }
    }

    this.fieldMappingServiceReady.next(true)
  }

  private mergeFields(localFields:object, remoteFields:object):object {
    /*
    https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects
    mergedFields is the union of localFields and remoteFields. Properties (keys) in remoteFields will overwrite those in localFields (later properties overwrite earlier properties with the same name)
    
    *** CONFLICT RESOLUTION: Using this convention means we are prioritising remoteFields when there is a conflict ***
    
    */
    let mergedFields = {...localFields, ...remoteFields};
    console.log('mergedFields: ',mergedFields)

    return mergedFields
  }

}

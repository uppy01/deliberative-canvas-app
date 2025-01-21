import { Injectable } from '@angular/core';
import Papa from 'papaparse';
import * as _ from 'lodash'

@Injectable({
  providedIn: 'root'
})
export class ParserService {

  constructor() { }

  async csvToJSON(fileToParse:any,isLocalFile:boolean,mappedFields:object):Promise<object[]> {
    
    //we wrap Papa.parse() in a Promise resolver as a way of waiting for Papa's asynchronous 'complete' callback to run before returning a result (entries)
    return new Promise(resolve => {
      
      let parseConfig:Papa.ParseConfig = {
        header: true,
        transformHeader: (header) => {
          return mappedFields?.hasOwnProperty(header) && mappedFields[header] !== '' ? mappedFields[header] : header
        },
        transform: (value,header) => {
          return value
        },
        complete: (results) => {
          console.log('results',results);
          let entries = results.data as object[]
          entries = this.doAdditionalCSVTransforms(entries,mappedFields)
          resolve(entries)
        }
      }

      if(!isLocalFile) {
        parseConfig['download'] = true
      }
      
      Papa.parse(fileToParse, parseConfig)
    
    })

  }

  doAdditionalCSVTransforms(entries:object[],mappedFields:object):object[] {

    for(let entry of entries) {
      
      //if there are field mappings then only keep the headers (fields) that are found in those mappings...
      if(mappedFields) {
        Object.entries(entry).forEach(([header,value]) => {
          let keepHeader = false
          Object.entries(mappedFields).forEach(([sourceField,exportField]) => {
            if(header == sourceField || header == exportField) {
             keepHeader = true 
            }
          })
          if(!keepHeader) {
            delete entries[entries.findIndex(object => object == entry)][header]
          }
        })
      }

      //if the entry has populated 'from' and 'to' fields/headers, we are going to assign it as a 'connection', otherwise assume it is an 'element'
      if(entry.hasOwnProperty('from') && entry['from'] !== '' && entry.hasOwnProperty('to') && entry['to'] !== '') {
        entry['canvasEntity'] = 'connection'
      }
      else {
        entry['canvasEntity'] = 'element'
      }

      
      for (let key in entry) {
        //if an entry key/field name suggests it could be of type Date then convert to our preferred date format (YYYY-MM-DD)...
        if(key.toLowerCase().includes('time') || key.toLowerCase().includes('date')) {
          entry[key] = this.transformDateField(entry[key])
        }
      }
    }
  
    return entries
  }

  transformDateField(value:string):string {
    let transformedDateField:string = ''

    //...if in milliseconds since Unix epoch (number with 13 digits), 
    if(Number(value) && value.toString().length >= 13) {
      transformedDateField = new Date(Number(value)).toISOString().slice(0,10) //returns "YYYY-MM-DDTHH:mm:ss.sssZ" - only grab first 10 characters
      console.log('converted Unix epoch milliseconds to date:',transformedDateField)
    }
    else {
      transformedDateField = value.slice(0,10) //only grab first 10 characters (which will hopefully be YYYY-MM-DD)
      console.log('trimmed date:',transformedDateField)
    }

    return transformedDateField
  }

  jsonToJSON(dataToParse:object,mappedFields:object):object[] {
    let transformedEntries:object[] = []
    
    let elements:object[] = []
    let connections:object[] = []

    let hasElements:boolean = false
    let elementSourceKey:string = ''
    let hasConnections:boolean = false
    let connectionSourceKey:string = ''

    
    Object.entries(mappedFields).forEach(([mappedFieldKey,mappedFieldVal]) => {
      if(mappedFieldVal === 'elements') {
        hasElements = true
        elementSourceKey = mappedFieldKey
        //'_.get' accepts a dot notation ('.') path for retrieving a nested object (which is the convention we are enforcing on the user when mapping nested objects), and returns that object (in our case it should be an array of 'element' objects)
        elements = _.get(dataToParse,elementSourceKey)
        
      } 
      if(mappedFieldVal === 'connections') {
        hasConnections = true
        connectionSourceKey = mappedFieldKey
        connections = _.get(dataToParse,connectionSourceKey)

      }
    })

    //if no element or connection keys were specified, we assume the first key in the object contains an array of element data (and that there is no connection data)
    if(!hasElements && !hasConnections) {
      elements = dataToParse[0]
    }

    console.log('hasElements: ', hasElements, 'elementSourceFieldName: ',elementSourceKey)
    console.log('elements:',elements)
    
    console.log('hasConnections: ', hasConnections, 'connectionSourceFieldName: ',connectionSourceKey)
    console.log('connections:',connections)

    let transformedElements = []
    for(let element of elements) {
      let transformedElement = {}
      transformedElement['canvasEntity'] = 'element'
      Object.entries(mappedFields).forEach(([sourceKey,exportKey]) => {
        //if we are currently iterating over a nested key of an element...(but not the 'elementSourceKey' itself)
        if(sourceKey !== elementSourceKey && sourceKey.slice(0,elementSourceKey.length) === elementSourceKey) {
          //remove the elementSourceKey portion from the start of the key string...(which will be in dot notation)
          sourceKey = sourceKey.replace(elementSourceKey + '.','')
          //use the exportKey (export field name) as the preferred key if it exists, otherwise use the trimmed sourceKey...
          const transformedElementKey = exportKey && exportKey !== '' ? exportKey : sourceKey
          //get the actual value (data being imported) for the key (using dot notation ('.') path)
          transformedElement[transformedElementKey] = _.get(element,sourceKey)

          //if it's a potential date field then transform to our preferred format...
          if(transformedElementKey.toLowerCase().includes('time') || transformedElementKey.toLowerCase().includes('date')) {
            transformedElement[transformedElementKey] = this.transformDateField(transformedElement[transformedElementKey])
          }
        } 
      })
      transformedElements.push(transformedElement)
    }
    console.log('transformedElements:',transformedElements)


    let transformedConnections = []
    for(let connection of connections) {
      let transformedConnection = {}
      transformedConnection['canvasEntity'] = 'connection'
      Object.entries(mappedFields).forEach(([sourceKey,exportKey]) => {
        //if we are currently iterating over a nested key of a connection...(but not the 'connectionSourceKey' itself)
        if(sourceKey !== connectionSourceKey && sourceKey.slice(0,connectionSourceKey.length) === connectionSourceKey) {
          //remove the connectionSourceKey portion from the start of the key string...(which will be in dot notation)
          sourceKey = sourceKey.replace(connectionSourceKey + '.','')
          //use the exportKey (export field name) as the preferred key if it exists, otherwise use the trimmed sourceKey...
          const transformedConnectionKey = exportKey && exportKey !== '' ? exportKey : sourceKey
          //get the actual value (data being imported) for the key (using dot notation ('.') path)
          transformedConnection[transformedConnectionKey] = _.get(connection,sourceKey)

          //if it's a potential date field then transform to our preferred format...
          if(transformedConnectionKey.toLowerCase().includes('time') || transformedConnectionKey.toLowerCase().includes('date')) {
            transformedConnection[transformedConnectionKey] = this.transformDateField(transformedConnection[transformedConnectionKey])
          }
        } 
      })
      if(!transformedConnection.hasOwnProperty('id')) {
        transformedConnection['id'] = transformedConnection['from'] + '__' + transformedConnection['to']
      }
      transformedConnections.push(transformedConnection)
    }
    console.log('transformedConnections:',transformedConnections)

    transformedEntries = transformedElements.concat(transformedConnections)

    return transformedEntries
  }

  generateKumuJSONString(entries):string {
    let kumuJSON = new Object()
    
    for(let entry of entries) {
      if(entry['canvasEntity']) {
        switch(entry['canvasEntity']) {
          case 'element':
            kumuJSON['elements'] ? kumuJSON['elements'].push(entry) : kumuJSON['elements'] = [entry]
            break
          case 'connection':
            kumuJSON['connections'] ? kumuJSON['connections'].push(entry) : kumuJSON['connections'] = [entry]
            break
          default:
            break
        }
      }
      else {
        kumuJSON['elements'] ? kumuJSON['elements'].push(entry) : kumuJSON['elements'] = [entry]
      }
      
    }
    
    return JSON.stringify(kumuJSON)
  }

}

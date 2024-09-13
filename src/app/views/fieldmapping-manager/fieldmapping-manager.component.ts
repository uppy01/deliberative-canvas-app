import { Component } from '@angular/core';
import { FieldmappingService } from '../../services/data/fieldmapping.service';
import { ExportLog, FieldMapping } from '../../model/schema';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import Papa from 'papaparse';
import { ExportlogService } from '../../services/data/exportlog.service';

@Component({
  selector: 'app-fieldmapping-manager',
  standalone: true,
  imports: [NgFor,NgIf,FormsModule,NgClass],
  templateUrl: './fieldmapping-manager.component.html',
  styleUrl: './fieldmapping-manager.component.css',
})
export class FieldmappingManagerComponent {

  Object = Object
  fieldMappings:FieldMapping[]
  activeFieldMappingID:string
  activeSourceField:string = ''
  activeExportField:string = ''
  sourceFieldBeingUpdated:string = ''
  newSourceName:string = ''
  fieldMappingIDBeingUpdated:string = ''
  templateFileName = ''
  template
  sourceFormats:string[] = ['csv','json']
  sourceFormatSelectedIndex:number = 0

  flattenedKeys:string[]

  constructor(private appService:AppService, private fieldMappingService:FieldmappingService, private exportLogService:ExportlogService) {
  
  }

  ngOnInit() {
    const fieldMappingServiceReadySubscription = this.fieldMappingService.fieldMappingServiceReady.subscribe((ready) => {
      if(ready) {
        this.getFieldMappings()
      }
    })
    //this.getFieldMappings()
  }

  ngAfterViewChecked() {
    if(this.fieldMappings?.length > 0) {
      this.fieldMappings.forEach((fieldMapping,i) => {
        const myCollapsableElement = document.getElementById('accordionCollapse'+i)
        myCollapsableElement.addEventListener('hide.bs.collapse', event => {
          //when the currently displayed view of the accordion is hidden we want to reset the add/edit state...
          this.sourceFieldBeingUpdated = ''
          this.activeSourceField = ''
          this.activeExportField = ''
        })
      })
    } 
  }

  async getFieldMappings() {
    console.log('getFieldMappings called')
    this.fieldMappings = await this.fieldMappingService.getFieldMappings()
    this.fieldMappings.sort((a,b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime())
    console.log(this.fieldMappings)
  }

  newSourceFieldMapping() {
    this.newSourceName = ''
    this.fieldMappingIDBeingUpdated = ''
    this.sourceFormatSelectedIndex = 0
  }

  async addSourceFieldMapping() {
    if(!this.fieldMappings.find((fieldMapping) => fieldMapping.sourceName.toLowerCase() === this.newSourceName.toLowerCase())) {
      const newFieldMapping:FieldMapping = {
        sourceName:this.newSourceName,
        sourceFormat: this.sourceFormats[this.sourceFormatSelectedIndex],
        isCoreSource: false,
        fields: this.template ? await this.parseTemplateFields() : {}
      }
      const result = await this.fieldMappingService.saveFieldMapping(newFieldMapping)
      if(result) {
        this.template = null
        this.getFieldMappings()
      }
    }
    else {
      alert('This source name already exists - please enter a unique name')
    }
    
  }

  sourceFormatSelectionChange(index:number) {
    this.sourceFormatSelectedIndex = index
  }

  async parseTemplateFields():Promise<object> {
    let fields = {}

    if(this.sourceFormats[this.sourceFormatSelectedIndex] === 'csv') {
      let fieldsArray = []
      
      //we wrap Papa.parse() in a Promise resolver as a way of waiting for Papa's asynchronous 'complete' callback to run before returning a result (the 'fields' object)
      return new Promise(resolve => {
        Papa.parse(this.template,{
          header: true,
          complete: (results) => {
            console.log('results',results);
            fieldsArray = results.meta.fields
            console.log(fieldsArray)
            fieldsArray?.forEach((fieldName) => {
              fields[fieldName] = ''
            })
            resolve(fields)
          }
        })
      })
    }
    
    if(this.sourceFormats[this.sourceFormatSelectedIndex] === 'json') {
      const jsonData = JSON.parse(await this.template.text())
      this.flattenJSON(jsonData)
      //sort keys alphabetically (ascending)
      this.flattenedKeys.sort()

      for(let key of this.flattenedKeys) {
        fields[key] = ''
      }

      return new Promise(resolve => resolve(fields))
    }

    return new Promise(null)
  }

  flattenJSON(jsonData) {
    this.flattenedKeys = []
    this.recursiveKeys(jsonData)
  }

  recursiveKeys(obj, keyPath = '') {

    Object.entries(obj).forEach(([key, val]) => {
      let nestedKeyPath = keyPath
      //if the key is actually an index (containing only numeric characters) we DO NOT add it to our key path...
      if(!(/^[0-9]+/).test(key)) {
        nestedKeyPath = keyPath + (keyPath ? '.' : '') + key;
      }
      //if we are dealing with an object then we want to keep drilling down into that nested object...
      if(typeof val === 'object') {
        this.recursiveKeys(val, nestedKeyPath);
      }
      //if we are not dealing with an object, or it is an array, then we want it added to our "flat" list of keys...
      if(typeof val !== 'object' || Array.isArray(val)) {
        this.flattenedKeys = [...new Set([...this.flattenedKeys, ...[nestedKeyPath]])]
      }
      
    });

  }

  editSourceFieldMapping(fieldMapping:FieldMapping) {
    this.newSourceName = fieldMapping.sourceName
    this.fieldMappingIDBeingUpdated = fieldMapping.id
    this.sourceFormatSelectedIndex = fieldMapping.sourceFormat ? this.sourceFormats.findIndex((format) => format === fieldMapping.sourceFormat) : 0
  }

  async duplicateSourceFieldMapping(fieldMapping:FieldMapping) {
    const newFieldMapping:FieldMapping = {
      sourceName: fieldMapping.sourceName + ' <COPY>',
      sourceFormat: fieldMapping.sourceFormat ? fieldMapping.sourceFormat : this.sourceFormats[this.sourceFormatSelectedIndex],
      isCoreSource: false,
      fields:fieldMapping.fields
    }
    const result = await this.fieldMappingService.saveFieldMapping(newFieldMapping)
    if(result) {
      this.getFieldMappings()
    }
  }

  async deleteSourceFieldMapping(fieldMappingID) {
    let confirmMessage = 'Are you sure you wish to delete this source and ALL its associated field mappings?'

    //check if the fieldMapping has been applied to any exportLog's...
    const exportLogs:ExportLog[] = await this.exportLogService.getExportLogs()
    if(exportLogs && exportLogs.length > 0) {
      if(exportLogs.find((exportLog) => exportLog.appliedFieldMappingID === fieldMappingID)){
        confirmMessage = "This source's field mappings have been applied to one or more data sets - are you sure you wish to delete this source and ALL its associated field mappings?"
      }
    }

    if(confirm(confirmMessage)) {
      const result = await this.fieldMappingService.deleteFieldMapping(fieldMappingID)
      if(result) {
        this.newSourceName = ''
        this.getFieldMappings()
      }
    }
  }

  async updateSourceName() {
    if(!this.fieldMappings.find((fieldMapping) => fieldMapping.sourceName.toLowerCase() === this.newSourceName.toLowerCase())) {
      let updatedFieldMapping = this.fieldMappings.find((fieldMapping) => fieldMapping.id === this.fieldMappingIDBeingUpdated)
      if(updatedFieldMapping.sourceName !== this.newSourceName) {
        updatedFieldMapping.sourceName = this.newSourceName
        updatedFieldMapping.sourceFormat = this.sourceFormats[this.sourceFormatSelectedIndex]
        const result = await this.fieldMappingService.saveFieldMapping(updatedFieldMapping)
        if(result) {
          this.getFieldMappings()
        }
      }
    }
    else {
      alert('This source name already exists - please enter a unique name')
    }
  }

  async addField(fieldMapping) {  
    if(this.activeExportField?.toLowerCase() === 'keywords') {
      this.activeExportField = ''
      alert('"keywords" is a reserved export field name - please enter a different export field name')
    }
    else {
      this.activeFieldMappingID = fieldMapping.id
    
      if(this.sourceFieldBeingUpdated !== '') {
        delete fieldMapping.fields[this.sourceFieldBeingUpdated]
      }
      
      const existingFields = fieldMapping.fields
      let newField = {}
      newField[this.activeSourceField] = this.activeExportField
      let mergedFields = {...existingFields, ...newField}
      console.log(mergedFields)

      //sort keys alphabetically (ascending)
      const sortedKeys = Object.keys(mergedFields).sort()
      //create a new object where keys/values will be added in the correct (sorted) order...
      let fields = {}
      for(let key of sortedKeys) {
        fields[key] = mergedFields[key]
      } 

      fieldMapping.fields = fields
      const result = await this.fieldMappingService.saveFieldMapping(fieldMapping)
      if(result) {
        this.sourceFieldBeingUpdated = ''
        this.activeSourceField = ''
        this.activeExportField = ''
        this.getFieldMappings()
      }
    }

    
  }

  async removeField(fieldMapping,key) {
    this.activeFieldMappingID = fieldMapping.id
    delete fieldMapping.fields[key]
    const result = await this.fieldMappingService.saveFieldMapping(fieldMapping)
    if(result) {
      this.getFieldMappings()
    }
  }

  async editField(key,value) {
    console.log('editField called',key,value)
    this.sourceFieldBeingUpdated = key
    this.activeSourceField = key
    this.activeExportField = value
  }

  cancelEditingField() {
    this.sourceFieldBeingUpdated = ''
    this.activeSourceField = ''
    this.activeExportField = ''
  }

  templateSelected(event) {
    this.template = event.target.files[0]
    event.target.value = '' //this resets value of the file input element so that the change event is still triggered if, the next time a file is selected, it is the same as the current one.
  }

  clearSelectedTemplate() {
    this.template = null
  }

}

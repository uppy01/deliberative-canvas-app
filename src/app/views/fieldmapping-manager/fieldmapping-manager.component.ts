import { Component } from '@angular/core';
import { FieldmappingService } from '../../services/data/fieldmapping.service';
import { FieldMapping } from '../../services/data/schema';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import Papa from 'papaparse';
import { BehaviorSubject } from 'rxjs';

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
  templateCSVFileName = ''
  templateCSV


  constructor(private appService:AppService, private fieldMappingService:FieldmappingService) {
  
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
    console.log(this.fieldMappings)
  }

  async addSourceFieldMapping() {
    if(!this.fieldMappings.find((fieldMapping) => fieldMapping.sourceName.toLowerCase() === this.newSourceName.toLowerCase())) {
      const newFieldMapping:FieldMapping = {
        sourceName:this.newSourceName,
        isCoreSource: false,
        fields: this.templateCSV ? await this.parseTemplateCSVFields() : {}
      }
      const result = await this.fieldMappingService.saveFieldMapping(newFieldMapping)
      if(result) {
        this.templateCSV = null
        this.getFieldMappings()
      }
    }
    else {
      alert('This source name already exists - please enter a unique name')
    }
    
  }

  async parseTemplateCSVFields():Promise<object> {
    let fieldsArray = []
    let fields = {}
    
    //we wrap Papa.parse() in a Promise resolver as a way of waiting for Papa's asynchronous 'complete' callback to run before returning a result (the 'fields' object)
    return new Promise(resolve => {
      Papa.parse(this.templateCSV,{
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

  async duplicateSourceFieldMapping(fieldMapping:FieldMapping) {
    const newFieldMapping:FieldMapping = {
      sourceName: fieldMapping.sourceName + ' <COPY>',
      isCoreSource: false,
      fields:fieldMapping.fields
    }
    const result = await this.fieldMappingService.saveFieldMapping(newFieldMapping)
    if(result) {
      this.getFieldMappings()
    }
  }

  async deleteSourceFieldMapping(fieldMappingID) {
    if(confirm('Are you sure you wish to delete this source and ALL its associated field mappings???')) {
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
      const mergedFields = {...existingFields, ...newField}
      console.log(mergedFields)

      fieldMapping.fields = mergedFields
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

  templateCSVSelected(event) {
    this.templateCSV = event.target.files[0]
    event.target.value = '' //this resets value of the file input element so that the change event is still triggered if, the next time a file is selected, it is the same as the current one.
  }

  clearSelectedTemplateCSV() {
    this.templateCSV = null
  }

}

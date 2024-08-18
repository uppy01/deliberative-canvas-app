import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { EarthstarDocPath, ExportLog, FieldMapping } from '../services/data/data-types';
import { ExportlogService } from '../services/data/exportlog.service';
import { SyncService } from '../services/sync.service';
import { AuthService } from '../services/auth.service';
import { FieldmappingService } from '../services/data/fieldmapping.service';
import Papa from 'papaparse';
import { generateRandomString } from '../utils/generator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-processor-pipeline',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './processor-pipeline.component.html',
  styleUrl: './processor-pipeline.component.css',
})
export class ProcessorPipelineComponent {

  fieldMappings:FieldMapping[]
  selectedFieldMapping:FieldMapping
  importURL:string = '' // 'https://wf-apps.net/deliberativecanvas/example-polis.csv'
  importedFile:File
  importedFileName:string = ''
  isRemoteFile:boolean = false
  mappedFields = {}
  responses:object[]
  exportedURL:string = ''
  selectedExportLog:ExportLog
  allExportLogs:ExportLog[]

  @ViewChild('showImportSource_btn')
  showImportSource_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showFieldMapping_btn')
  showFieldMapping_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showDataOutput_btn')
  showDataOutput_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showExport_btn')
  showExport_btn:ElementRef<HTMLButtonElement>
  

  constructor(private authService:AuthService, private fieldMappingService:FieldmappingService, private exportlogService:ExportlogService, private syncService:SyncService) { }

  ngOnInit() {
    this.getFieldMappings()
  }

  async getFieldMappings() {
    this.fieldMappings = await this.fieldMappingService.getFieldMappings()
    console.log(this.fieldMappings)

    if(!this.fieldMappings || this.fieldMappings.length === 0) {
      alert('no field mappings found')
    }
    else {
      this.selectedFieldMapping = this.fieldMappings[0]
    }
  }

  fieldMappingSelectionChange(event) {
    if(event.target.value !== '') {
      this.selectedFieldMapping = this.fieldMappings[event.target.value]
    }
    else {
      this.selectedFieldMapping = null
    }
  }

  localFileSelected(event) {
    this.importedFile = event.target.files[0]
    this.importedFileName = this.importedFile.name
    
    this.showFieldMapping_btn.nativeElement.click()
  }

  remoteFileSelected() {
    //append a random string of 4 characters to the remote file URL to prevent browser caching of the remote file
    const randomString = generateRandomString(4)
    console.log(randomString)
    this.importedFileName = 'Remote File' //TODO

    this.showFieldMapping_btn.nativeElement.click()
  }

  parseFile() {

    const fileToParse:any = this.importedFile ? this.importedFile : this.importURL
    this.mappedFields = this.selectedFieldMapping?.fields

    let parseConfig:Papa.ParseConfig = {
      header: true,
      transformHeader: (header) => {
        return this.mappedFields?.hasOwnProperty(header) ? this.mappedFields[header] : header
      },
      transform: (value,header) => {
        if(header === 'group-informed-consensus'){
          return Number(value).toFixed(3)
        }
        else {
          return value
        }
      },
      complete: (results) => {
        console.log('results',results);
        this.responses = results.data as object[]
        this.doAdditionalTransforms()
      }
    }

    if(!this.importedFile) {
      parseConfig['download'] = true
    }
    
    Papa.parse(fileToParse, parseConfig)
  }

  doAdditionalTransforms() {
    for(let i = 0 ; i < this.responses.length ; i++) {
      this.responses[i]['date'] = new Date(Number(this.responses[i]['timestamp'])).toUTCString()
    }
    this.responses.sort((a,b) => b['group-informed-consensus'] - a['group-informed-consensus'])

    this.showDataOutput_btn.nativeElement.click()
  }

  exportAsKumuJSON() {
    let kumuJSON = new Object()
    kumuJSON['elements'] = this.responses
    const kumuJSONString = JSON.stringify(kumuJSON)
    this.saveExport(kumuJSONString)
  }

  async saveExport(kumuJSONString:string) {
    const fileExtension = 'json'
    const fileName = this.importedFileName
    
    let exportLogToSave:ExportLog
    if(this.selectedExportLog) {
      exportLogToSave = this.selectedExportLog
    }
    else {
      exportLogToSave = {
        id: this.selectedExportLog ? this.selectedExportLog.id : null,
        title: 'test title 2',
        description: 'test description',
        fileName: fileName,
        fileExtension: fileExtension,
        fileData: new Blob([kumuJSONString], {type: `text/${fileExtension}`}),
        remoteURL: 'test remote URL'
      }
    }

    const result = await this.exportlogService.saveExportLog(exportLogToSave)
    if(result) {
      this.download(kumuJSONString,fileName,fileExtension)
      this.exportedURL = this.syncService.syncServerURL + result['doc']['path'] + '?share=' + this.authService.esSettings.shares[0]
    }
  }

  download(kumuJSONString:string, fileName:string, fileExtension) {
    const downloadFileName = fileName + '.' + fileExtension
    const blob = new Blob([kumuJSONString], {type: `text/${fileExtension}`});

    let elem = window.document.createElement('a');
    elem.setAttribute('href', window.URL.createObjectURL(blob));
    elem.setAttribute('download', downloadFileName);
    elem.dataset['downloadurl'] = [`text/${fileExtension}`, elem.download, elem.href].join(':');
    elem.draggable = true; 
    elem.classList.add('dragout');
    elem.click();
  }

  async copyExportedURL() {
    await navigator.clipboard.writeText(this.exportedURL)
  }

  async loadExport(id:EarthstarDocPath) {
    const result = await this.exportlogService.getExportLog(id)
    if(result) {
      this.selectedExportLog = result
      console.log(this.selectedExportLog)
      const kumuJSONString = await this.selectedExportLog.fileData.text()
      const kumuJSON = JSON.parse(kumuJSONString)
      console.log(kumuJSON)
      this.responses = kumuJSON['elements']
    }
    else {
      this.selectedExportLog = null
    }
    
  }

  
}

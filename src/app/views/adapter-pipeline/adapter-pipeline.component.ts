import { DatePipe, NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { EarthstarDocPath, ExportLog, FieldMapping, Keyword } from '../../services/data/schema';
import { ExportlogService } from '../../services/data/exportlog.service';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth.service';
import { FieldmappingService } from '../../services/data/fieldmapping.service';
import Papa from 'papaparse';
import { generateRandomString } from '../../utils/generator';
import { FormsModule } from '@angular/forms';
import { KeywordService } from '../../services/data/keyword.service';
import { AppService } from '../../services/app.service';
import { StorageService } from '../../services/storage.service';
import { KeywordAnnotatorComponent } from "../features/keyword-annotator/keyword-annotator.component";
import { AnnotatorService } from '../../services/annotator.service';

@Component({
  selector: 'app-adapter-pipeline',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, NgStyle, NgClass, KeywordAnnotatorComponent],
  templateUrl: './adapter-pipeline.component.html',
  styleUrl: './adapter-pipeline.component.css',
})
export class AdapterPipelineComponent {

  allExportLogs:ExportLog[]
  fieldMappings:FieldMapping[]
  keywords:Keyword[]
  appliedKeywords:Keyword[]
  selectedFieldMapping:FieldMapping
  sourceURL:string = '' // 'https://wf-apps.net/deliberativecanvas/example-polis.csv'
  sourceLocalFile:File
  importedFileName:string = ''
  isRemoteSourceFile:boolean = false
  isImportInProgress:boolean = false
  mappedFields = {}
  responses:object[]
  remoteJSONExportURL:string = ''
  selectedExportLog:ExportLog
  updatingRemoteDataSource:boolean = false
  progBarProgress:string = '0%';

  @ViewChild('showImportSource_btn')
  showImportSource_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showFieldMapping_btn')
  showFieldMapping_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showDataOutput_btn')
  showDataOutput_btn:ElementRef<HTMLButtonElement>
  @ViewChild('showExport_btn')
  showExport_btn:ElementRef<HTMLButtonElement>
  

  constructor(private appService:AppService, private authService:AuthService, private storageService:StorageService, private fieldMappingService:FieldmappingService, private exportlogService:ExportlogService, private keywordService:KeywordService, private annotatorService:AnnotatorService, private syncService:SyncService) { }

  ngOnInit() {
    console.log('ngOnInit called')
    this.selectedExportLog = {
      title: '',
      description: '',
      fileName: '',
      fileExtension: ''
    }

    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.getExportLogs()
        this.getKeywords()
      }
    })

    const fieldMappingServiceReadySubscription = this.fieldMappingService.fieldMappingServiceReady.subscribe((ready) => {
      if(ready) {
        this.getFieldMappings()
      }
    })
  }

  async getExportLogs() {
    this.allExportLogs = await this.exportlogService.getExportLogs()
    this.allExportLogs?.sort((a,b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime())

  }

  async getExportLog(id:EarthstarDocPath) {
    const result = await this.exportlogService.getExportLog(id)
    if(result) {
      this.selectedExportLog = result
      console.log(this.selectedExportLog)

      this.importedFileName = this.selectedExportLog.fileName

      this.remoteJSONExportURL = this.syncService.syncServerURL + this.selectedExportLog.id + '?share=' + this.authService.esSettings.shares[0]
      
      if(this.selectedExportLog.importSourceURL) {
        this.isRemoteSourceFile = true
        this.sourceURL = this.selectedExportLog.importSourceURL
      }
      else {
        this.isRemoteSourceFile = false
        this.sourceURL = ''
      }

      this.selectedFieldMapping = this.selectedExportLog.appliedFieldMappingID ? this.fieldMappings.find((fieldMapping) => fieldMapping.id === this.selectedExportLog.appliedFieldMappingID) : null

      this.appliedKeywords = this.selectedExportLog.appliedKeywordIDs ? this.keywords.filter((keyword) => this.selectedExportLog.appliedKeywordIDs.toString().includes(keyword.id)) : null
      console.log('appliedKeyWords',this.appliedKeywords)

      if(this.appliedKeywords && this.appliedKeywords.length > 0) {
        //update the 'isActive' property for all keywords based on the appliedKeywords
        for(let keyword of this.keywords) {
          keyword.isActive = this.appliedKeywords.find((appliedKeyword) => appliedKeyword.id === keyword.id) ? true : false
          await this.keywordService.saveKeyword(keyword)
        }
        this.getKeywords()
      }

      const kumuJSONString = await this.selectedExportLog.fileData?.text()
      if(kumuJSONString) {
        const kumuJSON = JSON.parse(kumuJSONString)
        console.log(kumuJSON)
        this.responses = kumuJSON['elements']
      }
    }
    else {
      this.selectedExportLog = null
    }
    
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

  async getKeywords() {
    this.keywords = await this.keywordService.getKeywords()
  }

  resetToNew() {
    this.selectedExportLog = {
      title: '',
      description: '',
      fileName: '',
      fileExtension: ''
    }
    this.appliedKeywords = null
    this.selectedFieldMapping = this.fieldMappings[0]
    this.sourceURL = ''
    this.sourceLocalFile = null
    this.importedFileName = ''
    this.isRemoteSourceFile = false
    this.mappedFields = {}
    this.responses = null
    this.remoteJSONExportURL = ''
    this.updatingRemoteDataSource = false

    this.progBarProgress = '0%'
    this.showImportSource_btn.nativeElement.click()
  }

  loadSavedExportLog(exportLogID) {
    this.getExportLog(exportLogID)
    this.showExport_btn.nativeElement.click()
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
    this.sourceLocalFile = event.target.files[0]
    this.importedFileName = this.sourceLocalFile.name
    event.target.value = '' //this resets value of the file input element so that the change event is still triggered if, the next time a file is selected, it is the same as the current one.

    this.sourceURL = ''
    this.isRemoteSourceFile = false

    this.responses = null
  }

  setRemoteFileLocation() {
    this.isRemoteSourceFile = true
    this.sourceLocalFile = null

    this.importedFileName = 'Remote Source File' //TODO
    
    this.responses = null
  }

  parseFile() {
    if(this.sourceLocalFile || this.sourceURL) {
      this.isImportInProgress = true

      //append a random string of 4 characters to the remote file URL to prevent browser caching of the remote file
      const fileToParse:any = this.sourceLocalFile ? this.sourceLocalFile : this.sourceURL + '?random=' + generateRandomString(4)

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

      if(!this.sourceLocalFile) {
        parseConfig['download'] = true
      }
      
      Papa.parse(fileToParse, parseConfig)
      }
  }

  doAdditionalTransforms() {
    console.log('doAdditionalTransforms called')
    for(let i = 0 ; i < this.responses.length ; i++) {
      this.responses[i]['date'] = new Date(Number(this.responses[i]['timestamp'])).toUTCString()
    }
    this.responses.sort((a,b) => b['group-informed-consensus'] - a['group-informed-consensus'])

    this.isImportInProgress = false

    if(this.updatingRemoteDataSource) {
      [this.responses,this.appliedKeywords] = this.annotatorService.addKeywordsToResponses(this.responses,this.keywords)

      this.saveExportLog()
    }
    
  }

  keywordsAnnotationComplete(responses:object[]) {
    this.responses = responses
  }

  appliedKeyWordsUpdated(appliedKeywords:Keyword[]) {
    this.appliedKeywords = appliedKeywords
  }

  newKeywordCreated() {
    this.getKeywords()
  }

  async exportAsKumuJSON() {
    this.download(this.generateKumuJSONString(),'json')
    //if the exportLog is an existing one then we want to update it when the user exports a JSON
    if(this.selectedExportLog.id) { 
      this.saveExportLog()
    }
  }

  async saveExportLog() {
    
    const kumuJSONString = this.generateKumuJSONString()
    const fileExtension = 'json'
    
    let exportLogToSave:ExportLog = {
      id: this.selectedExportLog ? this.selectedExportLog.id : null,
      title: this.selectedExportLog.title,
      description: this.selectedExportLog.description,
      fileName: this.importedFileName,
      fileExtension: fileExtension,
      fileData: new Blob([kumuJSONString], {type: `text/${fileExtension}`}),
      importSourceURL: this.sourceURL ? this.sourceURL : null,
      appliedFieldMappingID: this.selectedFieldMapping ? this.selectedFieldMapping.id : null,
      appliedKeywordIDs: this.appliedKeywords ? this.appliedKeywords.map((keyword) => keyword.id) : null
    }
 

    const result = await this.exportlogService.saveExportLog(exportLogToSave)
    if(result) {
      this.selectedExportLog = await this.exportlogService.getExportLog(result['doc']['path'])
      this.remoteJSONExportURL = this.syncService.syncServerURL + result['doc']['path'] + '?share=' + this.authService.esSettings.shares[0]
      
      await this.getExportLogs()
      this.syncService.doSync()
      
      if(this.updatingRemoteDataSource) { 
        this.updatingRemoteDataSource = false
      }
    }
  }

  download(kumuJSONString:string, fileExtension:string) {
    const downloadFileName = this.importedFileName.replace('.','-') + '.' + fileExtension
    const blob = new Blob([kumuJSONString], {type: `text/${fileExtension}`});

    let elem = window.document.createElement('a');
    elem.setAttribute('href', window.URL.createObjectURL(blob));
    elem.setAttribute('download', downloadFileName);
    elem.dataset['downloadurl'] = [`text/${fileExtension}`, elem.download, elem.href].join(':');
    elem.draggable = true; 
    elem.classList.add('dragout');
    elem.click();
  }

  generateKumuJSONString():string {
    let kumuJSON = new Object()
    kumuJSON['elements'] = this.responses
    return JSON.stringify(kumuJSON)
  }

  async copyExportedURL() {
    await navigator.clipboard.writeText(this.remoteJSONExportURL)
  }

  updateSyncRemoteSource() {
    this.updatingRemoteDataSource = true;
    this.responses = null
    this.parseFile()
  }

  renderProgressBar(progress:string) { 
    this.progBarProgress = progress
  }

  async removeExportLog() {
    if(confirm("Confirm you wish to delete...")) {
      const result = await this.exportlogService.deleteExportLog(this.selectedExportLog.id)
      if(result) {
        this.resetToNew()
        this.getExportLogs()
      }
    }
  }

}

import { Component, ElementRef, SecurityContext, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CanvasView, EarthstarDocPath, ExportLog } from '../../model/schema';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { CanvasviewService } from '../../services/data/canvasview.service';
import * as _ from 'lodash';
import { SyncService } from '../../services/sync.service';
import { ExportlogService } from '../../services/data/exportlog.service';
import Modal from 'bootstrap/js/dist/modal'
import { AuthService } from '../../services/auth.service';
import { TextFilterPipe } from '../../pipes/text-filter.pipe';

@Component({
  selector: 'app-canvasview-manager',
  standalone: true,
  imports: [FormsModule,NgFor,NgIf,DatePipe,TextFilterPipe],
  templateUrl: './canvasview-manager.component.html',
  styleUrl: './canvasview-manager.component.css',
})
export class CanvasviewManagerComponent {

  embedURLSafe:SafeResourceUrl = '';
  canvasViews:CanvasView[]
  exportLogs:ExportLog[]
  selectedCanvasView:CanvasView
  showCanvasViewDetail:boolean = false
  remoteJSONCanvasViewURL:string = ''
  canvasViewSearchText:string = ''
  embedURLRegEx = new RegExp(/https:\/\/([a-z0-9\-]+[.])kumu[.]io\//)
  projectURLRegEx = new RegExp(/https:\/\/kumu[.]io\/([a-z0-9\-]+[/])([a-z0-9\-])/)

  @ViewChild('canvasView_div')
  canvasView_div:ElementRef<HTMLDivElement>
  canvasView_modal:Modal

  @ViewChild('embed_iframe')
  embed_iframe:ElementRef<HTMLIFrameElement>


  constructor(private canvasViewService:CanvasviewService, private exportLogService:ExportlogService, protected syncService:SyncService, private authService:AuthService, private sanitizer: DomSanitizer) {
    this.initSelectedCanvasView()
    this.getCanvasViews()
    this.getExportLogs()
  }

  ngAfterViewInit() {
    this.canvasView_modal = new Modal(this.canvasView_div.nativeElement)
  }

  initSelectedCanvasView() {
    this.selectedCanvasView = {
      title: '',
      description: '',
      embedURL: '',
      projectURL: '',
      exportLogIDs: []
    }
    this.remoteJSONCanvasViewURL = ''
  }

  async getCanvasViews() {
    this.canvasViews = await this.canvasViewService.getCanvasViews()
    if(!this.canvasViews) {
      alert('there has been a problem retrieving canvas views')
    }
    else {
      this.canvasViews.sort((a,b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime())
    }
  }

  async getExportLogs() {
    this.exportLogs = await this.exportLogService.getExportLogs()
  }

  showCanvasView(canvasView:CanvasView) {
    this.selectedCanvasView = _.cloneDeep(canvasView)
    this.embedURLSafe = this.sanitizer.bypassSecurityTrustResourceUrl('');
    this.remoteJSONCanvasViewURL = this.syncService.syncServerURL + this.selectedCanvasView.id + '?share=' + this.authService.esSettings.shares[0]
    this.showCanvasViewDetail = true
  }

  showEmbed() {
    if(this.selectedCanvasView.embedURL !== '' && this.validateEmbedURL() && this.selectedCanvasView.embedURL !== this.embed_iframe.nativeElement.src) {
      const url = this.sanitizer.sanitize(SecurityContext.URL,this.selectedCanvasView.embedURL)
      this.embedURLSafe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  validateEmbedURL():boolean {
    return this.selectedCanvasView.embedURL !== '' ? this.embedURLRegEx.test(this.selectedCanvasView.embedURL) : true
  }

  validateProjectURL():boolean {
    return this.selectedCanvasView.projectURL !== '' ? this.projectURLRegEx.test(this.selectedCanvasView.projectURL) : true
  }

  createNewCanvasView() {
    this.initSelectedCanvasView()
    this.showCanvasViewDetail = true
  }

  async saveCanvasView() {
    const canvasViewJSONString = await this.generateCanvasViewJSONString() as string
    this.selectedCanvasView.fileData = new Blob([canvasViewJSONString], {type: 'application/json'})
    this.selectedCanvasView.fileExtension = 'json'

    const result = await this.canvasViewService.saveCanvasView(this.selectedCanvasView)
    if(result) {
      this.showCanvasViewDetail = false
      this.initSelectedCanvasView()
      this.getCanvasViews()
      //we want to sync with the server to make sure the remote JSON URL serves the updated CanvasView content...
      this.syncService.doSync()
    }
    else {
      alert('there was a problem saving the canvas view')
    }
  }
  
  async generateCanvasViewJSONString():Promise<string> {
    let exportLogs = []
    for(let exportLogID of this.selectedCanvasView.exportLogIDs) {
      const exportLog = await this.exportLogService.getExportLog(exportLogID)
      if(exportLog) {
        exportLogs.push({
          title: exportLog.title,
          description: exportLog.description,
          updated: exportLog.dateUpdated
        })
      }
    }

    let canvasViewJSON = {
      title: this.selectedCanvasView.title,
      description: this.selectedCanvasView.description,
      embedURL: this.selectedCanvasView.embedURL,
      projectURL: this.selectedCanvasView.projectURL,
      dataSources: exportLogs,
      updated: this.selectedCanvasView.dateUpdated
    }

    console.log(canvasViewJSON)
    return JSON.stringify(canvasViewJSON)
  }

  cancelCanvasView() {
    this.showCanvasViewDetail = false
    this.initSelectedCanvasView()
    this.embedURLSafe = this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  async deleteCanvasView() {
    if(confirm('confirm delete...')) {
      const result = await this.canvasViewService.deleteCanvasView(this.selectedCanvasView.id)
      if(result) {
        await this.getCanvasViews()
        this.cancelCanvasView()
      }
      else {
        alert('there was a problem deleting the canvas view')
        //the modal will have been automatically hidden using 'data-bs-dismiss' attribute so we need to show it again...
        this.canvasView_modal.show()
      }
    }
    else {
      //the modal will have been automatically hidden using 'data-bs-dismiss' attribute so we need to show it again...
      this.canvasView_modal.show()
    }
  }

  addExportLog(exportLogID:EarthstarDocPath) {
    this.selectedCanvasView.exportLogIDs.push(exportLogID)
  }

  removeExportLog(exportLogID:EarthstarDocPath) {
    //use the array filter function to remove just the ID of the current ExportLog for the selectedCanvasView
    this.selectedCanvasView.exportLogIDs = this.selectedCanvasView.exportLogIDs.filter((id) => id !== exportLogID)
  }

  renderExportLogTitle(exportLogID:EarthstarDocPath):string | null {
    if(this.exportLogs?.length > 0) {
      return this.exportLogs.find((exportLog) => exportLog.id === exportLogID)?.title
    }
    else {
      return null
    }
  }

  async downloadCanvasViewJSON() {
    const canvasViewJSONString = await this.generateCanvasViewJSONString() as string
    
    const downloadFileName = this.selectedCanvasView.title.replaceAll(' ','-') + '.json'
    const blob = new Blob([canvasViewJSONString], {type: 'application/json'});

    let elem = window.document.createElement('a');
    elem.setAttribute('href', window.URL.createObjectURL(blob));
    elem.setAttribute('download', downloadFileName);
    elem.dataset['downloadurl'] = ['application/json', elem.download, elem.href].join(':');
    //elem.draggable = true; 
    //elem.classList.add('dragout');
    elem.click();
  }

  async copyToClipboard(text:string) {
    await navigator.clipboard.writeText(text)
  }

 }

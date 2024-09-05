import { Component, Input } from '@angular/core';
import { CanvasView, EarthstarDocPath } from '../../../services/data/schema';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CanvasviewService } from '../../../services/data/canvasview.service';
import { ExportlogService } from '../../../services/data/exportlog.service';
import { SyncService } from '../../../services/sync.service';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-canvasview-connector',
  standalone: true,
  imports: [FormsModule,NgIf,NgFor],
  templateUrl: './canvasview-connector.component.html',
  styleUrl: './canvasview-connector.component.css',
})
export class CanvasviewConnectorComponent { 

  selectedCanvasView:CanvasView
  allCanvasViews:CanvasView[]
  connectedCanvasViews:CanvasView[]
  disconnectedCanvasViews:CanvasView[]
  showCanvasViewEditor:boolean = false
  remoteJSONCanvasViewURL:string = ''

  @Input()
  get exportLogID(): string { return this._exportLogID; }
  set exportLogID(exportLogID: EarthstarDocPath) {
    this._exportLogID = exportLogID;
    if(this._exportLogID && this._exportLogID !== '') {
      this.getCanvasViews()
    }
  }
  private _exportLogID = '';

  constructor(private canvasViewService:CanvasviewService, private exportLogService:ExportlogService, protected syncService:SyncService, private authService:AuthService, private storageService:StorageService) {
    this.initSelectedCanvasView()
    
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.getCanvasViews()
      }
    })
    
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
    this.connectedCanvasViews = []
    this.disconnectedCanvasViews = []
    this.allCanvasViews = await this.canvasViewService.getCanvasViews()
    if(!this.allCanvasViews) {
      alert('there has been a problem retrieving canvas views')
    }
    else {
      this.allCanvasViews.sort((a,b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime())
      
      for(let canvasView of this.allCanvasViews) {
        canvasView.exportLogIDs.find((id) => id === this._exportLogID) ? this.connectedCanvasViews.push(canvasView) : this.disconnectedCanvasViews.push(canvasView)
      }
    }
  }

  createNewCanvasView() {
    this.initSelectedCanvasView()
    this.showCanvasViewEditor = true;
  }

  editCanvasView(canvasView:CanvasView) {
    this.selectedCanvasView = canvasView 
    this.remoteJSONCanvasViewURL = this.syncService.syncServerURL + this.selectedCanvasView.id + '?share=' + this.authService.esSettings.shares[0]
    this.showCanvasViewEditor = true;
  }

  cancelEdit() {
    this.initSelectedCanvasView()
    this.showCanvasViewEditor = false;
  }

  addCanvasViewtoExportLog(canvasView:CanvasView) {
    this.selectedCanvasView = canvasView
    this.saveCanvasView()
  }

  removeCanvasViewFromExportLog(canvasView:CanvasView) {
    this.saveCanvasView(true)
  }

  async saveCanvasView(removefromExportLog:boolean=false) {
    if(removefromExportLog) {
      //use the array filter function to remove just the ID of the current ExportLog for the selectedCanvasView
      this.selectedCanvasView.exportLogIDs = this.selectedCanvasView.exportLogIDs.filter((id) => id !== this._exportLogID) 
    }
    else {
      //union - merges two arrays with the 2nd spread array overwriting matching values in the first array (ID's in this case)
      this.selectedCanvasView.exportLogIDs = [...new Set([...this.selectedCanvasView.exportLogIDs, ...[this._exportLogID]])]
    }
    console.log(this.selectedCanvasView.exportLogIDs)

    const canvasViewJSONString = await this.generateCanvasViewJSONString() as string
    this.selectedCanvasView.fileData = new Blob([canvasViewJSONString], {type: 'application/json'})
    this.selectedCanvasView.fileExtension = 'json'

    const result = await this.canvasViewService.saveCanvasView(this.selectedCanvasView)
    if(result) {
      this.showCanvasViewEditor = false
      this.initSelectedCanvasView()
      this.getCanvasViews()
      //we want to sync with the server to make sure the remote JSON URL serves the updated CanvasView content...
      this.syncService.doSync()
    }
    else {
      alert('there was a problem saving the canvas view')
    }
    
  }

  async copyToClipboard(text:string) {
    await navigator.clipboard.writeText(text)
  }

  checkCanvasViewContainsExportLog(canvasView:CanvasView):boolean {
    return canvasView.exportLogIDs.find((id) => id === this._exportLogID) ? true : false
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

}

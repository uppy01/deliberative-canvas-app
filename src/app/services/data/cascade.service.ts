import { Injectable } from '@angular/core';
import { CanvasView, EarthstarDocPath, ExportLog } from './schema';
import { CanvasviewService } from './canvasview.service';
import { ExportlogService } from './exportlog.service';
import { SyncService } from '../sync.service';

@Injectable({
  providedIn: 'root'
})
export class CascadeService {

  operation:string[] = ['UPDATE','DELETE']

  constructor(private canvasViewService:CanvasviewService, private exportLogService:ExportlogService, private syncService:SyncService) { 

  }

  /**
   * Cascades update/delete of ExportLog to CanvasView (relation defined in CanvasView 'exportLogIDs' array).
   * Also updates the attachment data for the CanvasView to reflect changes
   */
  async exportLogMutation(exportLogID:EarthstarDocPath,operation:string) {
    const canvasViews = await this.canvasViewService.getCanvasViews()
      if(canvasViews && canvasViews.length > 0) {
        for(let canvasView of canvasViews) {
          if(canvasView.exportLogIDs.find((id) => id === exportLogID)) {

            if(operation === 'DELETE') {
              const result = await this.canvasViewService.removeExportLogIDOnly(canvasView,exportLogID)
              if(result) {
                const updatedCanvasView = await this.canvasViewService.getCanvasView(canvasView.id)
                await this.updateCanvasViewAttachment(updatedCanvasView)
              } 
            }
            
            if(operation === 'UPDATE') {
              await this.updateCanvasViewAttachment(canvasView)
            }
          }
        }
      }

    console.log('cascade for exportLogMutation complete')
  }

  async updateCanvasViewAttachment(canvasView:CanvasView) {
    const canvasViewJSONString = await this.generateCanvasViewJSONString(canvasView) as string
    canvasView.fileData = new Blob([canvasViewJSONString], {type: 'application/json'})

    const result = await this.canvasViewService.saveCanvasViewAttachmentOnly(canvasView)
  }

  async generateCanvasViewJSONString(canvasView:CanvasView):Promise<string> {
    let exportLogs = []
    for(let exportLogID of canvasView.exportLogIDs) {
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
      title: canvasView.title,
      description: canvasView.description,
      embedURL: canvasView.embedURL,
      projectURL: canvasView.projectURL,
      dataSources: exportLogs,
      updated: canvasView.dateUpdated
    }

    console.log(canvasViewJSON)
    return JSON.stringify(canvasViewJSON)
  }

}

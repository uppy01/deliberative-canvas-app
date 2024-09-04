import { Injectable } from '@angular/core';
import { CanvasView, EarthstarDocPath, ExportLog, SchemaMutation } from './schema';
import { CanvasviewService } from './canvasview.service';
import { ExportlogService } from './exportlog.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FieldmappingService } from './fieldmapping.service';
import { KeywordService } from './keyword.service';

@Injectable({
  providedIn: 'root'
})
export class MutationCascadeService {

  schemaMutation:BehaviorSubject<SchemaMutation>
  schemaMutationSubscription:Subscription

  exportLogSubscription:Subscription
  fieldMappingSubscription:Subscription

  constructor(private canvasViewService:CanvasviewService, private exportLogService:ExportlogService, private fieldMappingService:FieldmappingService, private keywordService:KeywordService) { 
    
    this.schemaMutation = new BehaviorSubject({schemaName:'',id:'',operation:'INIT'})
    this.exportLogService.schemaMutation = this.schemaMutation
    this.fieldMappingService.schemaMutation = this.schemaMutation
    this.keywordService.schemaMutation = this.schemaMutation

    this.schemaMutationSubscription = this.schemaMutation.subscribe((mutation) => {
      if(mutation.operation === 'INIT') {
        console.log(`schema mutation subscription initialised in mutation cascade service`)
      }
      else {
        switch(mutation.schemaName) {
          case 'exportlog':
            this.exportLogMutation(mutation.id,mutation.operation)
            break
          case 'fieldmapping':
            this.fieldMappingMutation(mutation.id,mutation.operation)
            break
          case 'keyword':
            this.keywordMutation(mutation.id,mutation.operation)
            break
          default:
            break
        }
      }
    })
  }

  /**
   * Cascades update/delete of ExportLog to CanvasView (relation defined in CanvasView 'exportLogIDs' array).
   * Also updates the attachment data for the CanvasView for related ExportLog('s)
   */
  private async exportLogMutation(exportLogID:EarthstarDocPath,operation:string) {
    console.log('ExportLog Mutation Cascade - ' + operation)
    const canvasViews = await this.canvasViewService.getCanvasViews()
      if(canvasViews && canvasViews.length > 0) {
        for(let canvasView of canvasViews) {
          if(canvasView.exportLogIDs.find((id) => id === exportLogID)) {

            if(operation === 'DELETE') {
              //use the array filter function to remove only the specified exportLogID
              canvasView.exportLogIDs = canvasView.exportLogIDs.filter((id) => id !== exportLogID)
              const result = await this.canvasViewService.cascadeSaveCanvasView(canvasView)
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

  private async updateCanvasViewAttachment(canvasView:CanvasView) {
    const canvasViewJSONString = await this.generateCanvasViewJSONString(canvasView) as string
    canvasView.fileData = new Blob([canvasViewJSONString], {type: 'application/json'})

    const result = await this.canvasViewService.saveCanvasViewAttachmentOnly(canvasView)
  }

  private async generateCanvasViewJSONString(canvasView:CanvasView):Promise<string> {
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

  /**
   * Cascades delete of FieldMapping to ExportLog (relation defined in ExportLog 'appliedFieldMappingID' property)
   */
  private async fieldMappingMutation(fieldMappingID:EarthstarDocPath,operation:string) {
    console.log('FieldMapping Mutation Cascade - ' + operation)
    
    if(operation === 'DELETE') {
      const exportLogs:ExportLog[] = await this.exportLogService.getExportLogs()
      if(exportLogs && exportLogs.length > 0) {
        for(let exportLog of exportLogs) {
          if(exportLog.appliedFieldMappingID === fieldMappingID) {
            exportLog.appliedFieldMappingID = null
            await this.exportLogService.cascadeSaveExportLog(exportLog)
          }
        }
      }
    }

    console.log('cascade for fieldMappingMutation complete')
  }

  /**
   * Cascades delete of Keyword to ExportLog (relation defined in ExportLog 'appliedKeywordIDs' array)
   */
  private async keywordMutation(keywordID:EarthstarDocPath,operation:string) {
    console.log('Keyword Mutation Cascade - ' + operation)
    
    if(operation === 'DELETE') {
      const exportLogs:ExportLog[] = await this.exportLogService.getExportLogs()
      if(exportLogs && exportLogs.length > 0) {
        for(let exportLog of exportLogs) {
          if(exportLog.appliedKeywordIDs?.find((id) => id === keywordID)) {
            //use the array filter function to remove only the specified keywordID
            exportLog.appliedKeywordIDs = exportLog.appliedKeywordIDs.filter((id) => id !== keywordID)
            const result = await this.exportLogService.cascadeSaveExportLog(exportLog)
          }
        }
      }
    }

    console.log('cascade for keywordMutation complete')
  }

}

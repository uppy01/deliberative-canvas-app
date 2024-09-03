import { Component } from '@angular/core';
import { KeywordService } from '../../services/data/keyword.service';
import { ExportLog, Keyword } from '../../services/data/schema';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { AppService } from '../../services/app.service';
import { StorageService } from '../../services/storage.service';
import { ExportlogService } from '../../services/data/exportlog.service';

@Component({
  selector: 'app-keyword-manager',
  standalone: true,
  imports: [FormsModule,NgFor,NgIf],
  templateUrl: './keyword-manager.component.html',
  styleUrl: './keyword-manager.component.css',
})
export class KeywordManagerComponent {

  allKeywords:Keyword[]
  keywordVariants:string = ''
  selectedKeyword:Keyword

  constructor(private appService:AppService, private storageService:StorageService, private keywordService:KeywordService, private exportLogService:ExportlogService) {

  }

  ngOnInit() {
    this.selectedKeyword = {
      word: '',
      variants: [],
      isActive: false
    }
    
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.getAllKeywords()
      }
    })
    
  }

  async getAllKeywords() {
    this.allKeywords = await this.keywordService.getKeywords()
    this.allKeywords.sort((a,b) => a.word.toLowerCase() < b.word.toLowerCase() ? -1 : 1 )
  }

  async saveKeyword() {
    this.selectedKeyword.variants = this.keywordVariants !== '' ? this.keywordVariants.split(',') : []
    console.log(this.selectedKeyword.variants?.length)
    const result = await this.keywordService.saveKeyword(this.selectedKeyword)
    if(result) {
      this.selectedKeyword = {
        word: '',
        variants: [],
        isActive: false
      }
      this.keywordVariants = ''
      this.getAllKeywords()
    }
  }

  editKeyword(keywordID) {
    this.selectedKeyword = this.allKeywords.find((keyword) => keyword.id === keywordID)
    this.keywordVariants = this.selectedKeyword.variants.toString()
  }

  cancelEditingKeyword() {
    this.selectedKeyword = {
      word: '',
      variants: [],
      isActive: false
    }
    this.keywordVariants = ''
  }

  async removeKeyword(keywordID:string) {
    //first check if the keyword has been applied to any exportLog's...
    const exportLogs:ExportLog[] = await this.exportLogService.getExportLogs()
    if(exportLogs && exportLogs.length > 0) {
      if(exportLogs.find((exportLog) => exportLog.appliedKeywordIDs.toString().includes(keywordID))){
        if(!confirm('This keyword has been applied to one or more data sets - are you sure you wish to delete it?')) {
          return
        }
      }
    }

    const result = await this.keywordService.deleteKeyword(keywordID)
    if(result) {
      this.selectedKeyword = {
        word: '',
        variants: [],
        isActive: false
      }
      this.keywordVariants = ''
      this.getAllKeywords()
    }
  }

}

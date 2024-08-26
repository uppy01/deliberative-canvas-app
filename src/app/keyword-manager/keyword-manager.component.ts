import { Component } from '@angular/core';
import { KeywordService } from '../services/data/keyword.service';
import { Keyword } from '../services/data/schema';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { AppService } from '../services/app.service';
import { StorageService } from '../services/storage.service';

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

  constructor(private appService:AppService, private storageService:StorageService, private keywordService:KeywordService) {

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
  }

  async removeKeyword(keywordID) {
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

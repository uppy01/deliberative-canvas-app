import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Keyword } from '../../../services/data/schema';
import { FormsModule } from '@angular/forms';
import { KeywordService } from '../../../services/data/keyword.service';
import { AnnotatorService } from '../../../services/annotator.service';
import { StorageService } from '../../../services/storage.service';


@Component({
  selector: 'app-keyword-annotator',
  standalone: true,
  imports: [NgFor,FormsModule],
  templateUrl: './keyword-annotator.component.html',
  styleUrl: './keyword-annotator.component.css',
})
export class KeywordAnnotatorComponent {

  
  newKeyword:string = ''
  newKeywordVariants:string = ''

  @Input()
  keywords:Keyword[]

  @Input()
  appliedKeywords:Keyword[]
  
  @Input()
  responses:object[]

  @Output()
  keywordsAnnotationComplete = new EventEmitter<object[]>()

  @Output()
  appliedKeywordsUpdated = new EventEmitter<Keyword[]>()

  @Output()
  newKeywordCreated = new EventEmitter()


  constructor(private storageService:StorageService, private keywordService:KeywordService, private annotatorService:AnnotatorService) {
    
  }

  keywordsToggle(activateAll:boolean) {
    this.keywords.forEach((keyword) => {
      keyword.isActive = activateAll
    })
  }

  allKeywordsDeselected():boolean {
    return this.keywords?.find((keyword) => keyword.isActive === true) ? false : true
  }

  async addKeywordsToResponses() {
    [this.responses,this.appliedKeywords] = this.annotatorService.addKeywordsToResponses(this.responses,this.keywords)

    this.keywordsAnnotationComplete.emit(this.responses)
    this.appliedKeywordsUpdated.emit(this.appliedKeywords)
  }

  removeAllKeywordsFromResponses() {
    this.responses.map((response) => {
      response['keywords'] = []
    })
    this.keywordsAnnotationComplete.emit(this.responses)

    this.appliedKeywords = null
    this.appliedKeywordsUpdated.emit(this.appliedKeywords)
  }

  async createNewKeyword() {
    const keyword:Keyword = {
      word: this.newKeyword,
      variants: this.newKeywordVariants.length > 0 ? this.newKeywordVariants.split(',') : [],
      isActive: true
    }
    const result = await this.keywordService.saveKeyword(keyword)
    if(result) {
      this.newKeyword = ''
      this.newKeywordVariants = ''

      this.newKeywordCreated.emit()
    }
  }

 }

import { Injectable } from '@angular/core';
import { Keyword } from '../model/schema';

@Injectable({
  providedIn: 'root'
})
export class AnnotatorService {

  constructor() { 

  }

  addKeywordsToEntries(entries:object[],keywords:Keyword[]):[object[],Keyword[]] {
    const keywordsToApply:Keyword[] = keywords.filter((keyword) => keyword.isActive === true)
    let entryKeywords
    
    if(keywordsToApply?.length > 0 && entries?.length > 0) {
      entries.forEach((entry,i) => {
        entryKeywords = []
        keywordsToApply.forEach((keyword) => {
          if(entry['label']?.toLowerCase().includes(keyword.word.toLowerCase()) || 
            keyword.variants.some(variant => entry['label']?.toLowerCase().includes(variant.toLowerCase())) || 
            entry['description']?.toLowerCase().includes(keyword.word.toLowerCase()) || 
            keyword.variants.some(variant => entry['description']?.toLowerCase().includes(variant.toLowerCase())))
          {
              entryKeywords.push(keyword.word)
          }
        })
        entries[i]['keywords'] = entryKeywords
      })
      
      console.log(entries)
    }

    return [entries,keywordsToApply]
 
  }

}

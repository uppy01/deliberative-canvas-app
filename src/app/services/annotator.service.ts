import { Injectable } from '@angular/core';
import { Keyword } from './data/schema';

@Injectable({
  providedIn: 'root'
})
export class AnnotatorService {

  constructor() { 

  }

  addKeywordsToResponses(responses:object[],keywords:Keyword[]):[object[],Keyword[]] {
    const appliedKeywords:Keyword[] = keywords.filter((keyword) => keyword.isActive === true)
    let responseKeywords
    
    if(appliedKeywords?.length > 0 && responses?.length > 0) {
      responses.forEach((response,i) => {
        responseKeywords = []
        appliedKeywords.forEach((keyword) => {
          if(response['Label']?.toLowerCase().includes(keyword.word.toLowerCase()) || 
            keyword.variants.some(variant => response['Label']?.toLowerCase().includes(variant.toLowerCase())) || 
            response['Description']?.toLowerCase().includes(keyword.word.toLowerCase()) || 
            keyword.variants.some(variant => response['Description']?.toLowerCase().includes(variant.toLowerCase())))
          {
              responseKeywords.push(keyword.word)
          }
        })
        responses[i]['keywords'] = responseKeywords
      })
      
      console.log(responses)
    }

    return [responses,appliedKeywords]
 
  }

}

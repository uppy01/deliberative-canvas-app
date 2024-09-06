import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SchemaMutation } from './schema';

@Injectable({
  providedIn: 'root'
})
export class SchemaService {

  mutationEvent:BehaviorSubject<SchemaMutation>

  constructor() {
    this.mutationEvent = new BehaviorSubject({schemaName:'',id:'',operation:'INIT'})
  }

}

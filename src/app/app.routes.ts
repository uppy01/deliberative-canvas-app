import { Routes } from '@angular/router';
import { FieldMapperComponent } from './field-mapper/field-mapper.component';
import { ProcessorPipelineComponent } from './processor-pipeline/processor-pipeline.component';

export const routes: Routes = [
    { path:'', component:ProcessorPipelineComponent },
    { path:'field-mapper', component:FieldMapperComponent },

];

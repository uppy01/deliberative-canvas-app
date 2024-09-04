import { Routes } from '@angular/router';
import { FieldmappingManagerComponent } from './views/fieldmapping-manager/fieldmapping-manager.component';
import { AdapterPipelineComponent } from './views/adapter-pipeline/adapter-pipeline.component';
import { KeywordManagerComponent } from './views/keyword-manager/keyword-manager.component';
import { CanvasviewManagerComponent } from './views/canvasview-manager/canvasview-manager.component';

export const routes: Routes = [
    { path:'fieldmapping-manager', title: 'Field Mapping', component:FieldmappingManagerComponent },
    { path:'keyword-manager', title: 'Keywords', component:KeywordManagerComponent },
    { path:'canvasview-manager', title: 'Canvas Views', component:CanvasviewManagerComponent },
    { path:'', title: 'Main', component:AdapterPipelineComponent, data:{reuse: true} },
    { path:'\*\*', component:AdapterPipelineComponent}
];

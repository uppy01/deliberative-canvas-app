import { Routes } from '@angular/router';
import { FieldmappingManagerComponent } from './views/fieldmapping-manager/fieldmapping-manager.component';
import { AdapterPipelineComponent } from './views/adapter-pipeline/adapter-pipeline.component';
import { KeywordManagerComponent } from './views/keyword-manager/keyword-manager.component';
import { KumuEmbedComponent } from './views/kumu-embed/kumu-embed.component';

export const routes: Routes = [
    { path:'fieldmapping-manager', title: 'Field Mapping', component:FieldmappingManagerComponent },
    { path:'keyword-manager', title: 'Keywords', component:KeywordManagerComponent },
    { path:'kumu-embed', title: 'Kumu Embed', component:KumuEmbedComponent },
    { path:'', title: 'Main', component:AdapterPipelineComponent, data:{reuse: true} },
    { path:'\*\*', component:AdapterPipelineComponent}
];

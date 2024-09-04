import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-canvasview-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './canvasview-manager.component.html',
  styleUrl: './canvasview-manager.component.css',
})
export class CanvasviewManagerComponent {

  kumuEmbedURL:string = ''
  urlSafe: SafeResourceUrl;


  constructor(public sanitizer: DomSanitizer) {

  }

  ngOnInit() {
    this.loadIframeContent()
  }
  
  loadIframeContent() {
    if(this.kumuEmbedURL !== '') this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.kumuEmbedURL);
  }

 }

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-kumu-embed',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './kumu-embed.component.html',
  styleUrl: './kumu-embed.component.css',
})
export class KumuEmbedComponent {

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

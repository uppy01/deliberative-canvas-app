import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AppService } from './services/app.service';
import { LinkDeviceComponent } from "./link-device/link-device.component";
import Modal from 'bootstrap/js/dist/modal'
import { SyncService } from './services/sync.service';
import { FormsModule } from '@angular/forms';
import * as Earthstar from 'earthstar'
import { AboutuserService } from './services/data/aboutuser.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LinkDeviceComponent,FormsModule,NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Deliberative Canvas App';
  context:string = 'dev'
  
  displayName:string = ''

  @ViewChild('linkDevice_div')
  linkDevice:ElementRef<HTMLDivElement>
  linkDevice_Modal:Modal

  @ViewChild(LinkDeviceComponent)
  linkDevice_component:LinkDeviceComponent


  constructor(protected appService:AppService, protected authService:AuthService, private aboutUserService:AboutuserService, protected syncService:SyncService) {
    
  }

  ngOnInit() {
    const storageConfiguredSubscription = this.appService.storageConfigured.subscribe((configured) => {
      if(configured) {
        this.getDisplayName()
      }
    })
  }

  ngAfterViewInit() {
    this.linkDevice_Modal = new Modal(this.linkDevice.nativeElement)
    
    this.linkDevice.nativeElement.addEventListener('hidden.bs.modal', event => {
      this.linkDevice_component.reset()
    })
    
    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.get('linkdevice')) {
      this.linkDevice_Modal.show()
    }
  }

  async getDisplayName() {
    this.displayName = await this.aboutUserService.getDisplayName()
  }

  async saveDisplayName() {
    const result = await this.aboutUserService.saveDisplayName(this.displayName)
    if(result) {
      this.getDisplayName()
    }
  }

  createLink() {
    this.linkDevice_Modal.show()
  }

  async copyToClipboard(text:string) {
    await navigator.clipboard.writeText(text)
  }

}

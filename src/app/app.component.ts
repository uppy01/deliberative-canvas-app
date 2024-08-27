import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AppService } from './services/app.service';
import { LinkDeviceComponent } from "./views/features/link-device/link-device.component";
import Modal from 'bootstrap/js/dist/modal'
import { SyncService } from './services/sync.service';
import { FormsModule } from '@angular/forms';
import { AboutuserService } from './services/data/aboutuser.service';
import { NgIf } from '@angular/common';
import { StorageService } from './services/storage.service';

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

  @ViewChild('linkDevice_div')
  linkDevice:ElementRef<HTMLDivElement>
  linkDevice_Modal:Modal

  @ViewChild(LinkDeviceComponent)
  linkDevice_component:LinkDeviceComponent


  constructor(protected appService:AppService, protected authService:AuthService, private storageService:StorageService, protected syncService:SyncService, private aboutUserService:AboutuserService) {
    
  }

  ngOnInit() {
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {

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

  async saveDisplayName() {
    const result = await this.aboutUserService.saveDisplayName(this.appService.userDisplayName)
    if(result) {
      await this.aboutUserService.getDisplayName()
    }
  }

  createLink() {
    this.linkDevice_Modal.show()
  }

  async copyToClipboard(text:string) {
    await navigator.clipboard.writeText(text)
  }

}

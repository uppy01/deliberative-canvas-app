import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AppService } from './services/app.service';
import { LinkProfileComponent } from "./views/features/link-profile/link-profile.component";
import Modal from 'bootstrap/js/dist/modal'
import { SyncService } from './services/sync.service';
import { FormsModule } from '@angular/forms';
import { AboutuserService } from './services/data/aboutuser.service';
import { NgIf } from '@angular/common';
import { StorageService } from './services/storage.service';
import { MutationCascadeService } from './services/data/mutation-cascade.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LinkProfileComponent,FormsModule,NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Deliberative Canvas App';
  appVersion = 'v0.1.0'

  @ViewChild('linkProfile_div')
  linkProfile:ElementRef<HTMLDivElement>
  linkProfile_Modal:Modal

  @ViewChild('profileDetails_div')
  profileDetails:ElementRef<HTMLDivElement>
  profileDetails_Modal:Modal

  @ViewChild(LinkProfileComponent)
  linkProfile_component:LinkProfileComponent


  constructor(protected appService:AppService, protected authService:AuthService, private storageService:StorageService, protected syncService:SyncService, private aboutUserService:AboutuserService, private mutationCascadeService:MutationCascadeService) {
    
  }

  ngOnInit() {
    const storageConfiguredSubscription = this.storageService.storageConfigured.subscribe((configured) => {
      if(configured) {

      }
    })
  }

  ngAfterViewInit() {
    //we explicitly instantiate for ALL modals to eliminate weird errors when using bootstrap modal's javascript methods and events
    this.linkProfile_Modal = new Modal(this.linkProfile.nativeElement)
    this.profileDetails_Modal = new Modal(this.profileDetails.nativeElement)
    
    this.linkProfile.nativeElement.addEventListener('hidden.bs.modal', event => {
      this.linkProfile_component.reset()
    })
    
    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.get('linkprofile')) {
      this.linkProfile_Modal.show()
    }
  }

  async saveDisplayName() {
    const result = await this.aboutUserService.saveDisplayName(this.appService.userDisplayName)
    if(result) {
      await this.aboutUserService.getDisplayName()
    }
  }

  async copyToClipboard(text:string) {
    await navigator.clipboard.writeText(text)
  }

}

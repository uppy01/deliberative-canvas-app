import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AppService } from './services/app.service';
import { LinkDeviceComponent } from "./link-device/link-device.component";
import Modal from 'bootstrap/js/dist/modal'
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LinkDeviceComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Deliberative Canvas App';

  @ViewChild('linkDevice_div')
  linkDevice:ElementRef<HTMLDivElement>
  linkDevice_Modal:Modal

  @ViewChild(LinkDeviceComponent)
  linkDevice_component:LinkDeviceComponent


  constructor(protected appService:AppService, protected authService:AuthService, protected syncService:SyncService) {
    
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

  createLink() {
    this.linkDevice_Modal.show()
  }

}

import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MyCrypto } from '../utils/mycrypto';
import qrcodegen from '@ribpay/qr-code-generator';
import { toSvgString } from "@ribpay/qr-code-generator/utils";
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { EarthstarProfile } from '../services/data/schema';
import { AboutuserService } from '../services/data/aboutuser.service';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-link-device',
  standalone: true,
  imports: [FormsModule,NgIf],
  templateUrl: './link-device.component.html',
  styleUrl: './link-device.component.css'
})
export class LinkDeviceComponent {

  linkPassword:string = ''
  linkToSend:string = ''
  profileToEncrypt:string
  encryptedLink:string
  myCrypto:MyCrypto = new MyCrypto()
  myQRCodeGenerator = qrcodegen.QrCode

  @ViewChild('qrCodeOutput')
  qrCodeOutput:ElementRef<HTMLDivElement>

  receivingLink:boolean

  @Input()
  displayName:string


  constructor(private authService:AuthService, private syncService:SyncService, private aboutUserService:AboutuserService) {
    this.encryptedLink = window.location.hash?.slice(1)
    const urlParams = new URLSearchParams(window.location.search)
    this.receivingLink = urlParams.get('linkdevice') ? true : false
  }

  async generateEncryptedLink() {
    this.profileToEncrypt = JSON.stringify(this.generateUserProfile())
    
    try {
      const result = await this.myCrypto.encrypt(this.profileToEncrypt,this.linkPassword)
      console.log(result)
      this.encryptedLink = result
      this.generateQRCode()
    }
    catch(e) {
      console.log(e)
      alert('ERROR! - something has gone wrong - no link generated')
    }
  }

  generateUserProfile():EarthstarProfile {
    let shares:EarthstarProfile['shares'] = []
    this.authService.esSettings.shares?.forEach((share) => {
      shares.push({shareAddress: share, shareSecret: this.authService.esSettings.shareSecrets[share]})
    })
    
    const userProfile:EarthstarProfile = {
      author: this.authService.esSettings.author,
      shares: shares,
      displayName: this.displayName && this.displayName !== '' ? this.displayName : '',
      syncServerURL: this.syncService.syncServerURL && this.syncService.syncServerURL !== '' ? this.syncService.syncServerURL : ''
    }
    
    console.log(userProfile)
    
    return userProfile
  }

  async decryptLink() {
    try {
      const result = await this.myCrypto.decrypt(this.encryptedLink,this.linkPassword)
      console.log(JSON.parse(result))
      const userProfile:EarthstarProfile = JSON.parse(result)
      this.importProfile(userProfile)
    }
    catch(e) {
      console.log(e)
      alert('ERROR! - something has gone wrong. You may have entered the wrong password, or the linking url is incorrect')
    }
  }

  generateQRCode() {
    this.linkToSend = window.location.protocol + '//' + window.location.host + '?linkdevice=true#' + this.encryptedLink
    console.log(this.linkToSend)
    const qrCode = this.myQRCodeGenerator.encodeText(this.linkToSend, this.myQRCodeGenerator.Ecc.HIGH)
    const qrCodeSVG = toSvgString(qrCode,1,"#FFFFFF","#000000")
    this.qrCodeOutput.nativeElement.innerHTML = qrCodeSVG
  }

  async copyLinkToClipboard() {
    await navigator.clipboard.writeText(this.linkToSend)
  }

  async importProfile(userProfile:EarthstarProfile) {
    this.authService.updateAuthorCredentials(userProfile.author)
    this.authService.updateShares(userProfile.shares,true)
    await this.aboutUserService.saveDisplayName(userProfile.displayName)

    this.syncService.addSyncServer(userProfile.syncServerURL)
    const syncCompletedSubscription = this.syncService.syncCompletedSuccessfully.subscribe((success) => {
      if(success) {
        window.location.replace(window.location.protocol + '//' + window.location.host)
      }
    })
  }

  reset() {
    this.receivingLink = false
    this.linkPassword = ''
    this.linkToSend = ''
    if(this.qrCodeOutput) this.qrCodeOutput.nativeElement.innerHTML = null
  }

}

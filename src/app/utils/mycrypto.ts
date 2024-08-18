/***
 * THIS CLASS IS BASED ON - https://dev.to/halan/4-ways-of-symmetric-cryptography-and-javascript-how-to-aes-with-javascript-3o1b
 *   
 */

export class MyCrypto {

  encoder:TextEncoder = new TextEncoder();
  decoder:TextDecoder = new TextDecoder();
  salt:Uint8Array
  iv:Uint8Array
  defaultLengths:number = 16
  secretKey:CryptoKey

  constructor() { }

  async encrypt(stringToEncrypt:string, password:string):Promise<string> {
    this.salt = window.crypto.getRandomValues(new Uint8Array(this.defaultLengths));
    this.iv = window.crypto.getRandomValues(new Uint8Array(this.defaultLengths));

    this.secretKey = await this.generatePBKDF2(password)
    
    const plain_text:Uint8Array = this.encoder.encode(stringToEncrypt)

    const encrypted = await window.crypto.subtle.encrypt(
      {name: "AES-CBC",iv: this.iv},
      this.secretKey,
      plain_text
    );

    const encryptedConcat = this.toBase64([
      ...this.salt,
      ...this.iv,
      ...new Uint8Array(encrypted)
    ])
    
    console.log({
      salt: this.toBase64(this.salt),
      iv: this.toBase64(this.iv),
      encrypted: this.toBase64(encrypted),
      concatennated: encryptedConcat
    });

    return encryptedConcat
  }

  async decrypt(stringToDecrypt:string, password:string):Promise<string> {
    let decryptedString:string = '';

    const encrypted = this.fromBase64(stringToDecrypt)

    const salt_len = this.defaultLengths;
    const iv_len = this.defaultLengths;
    this.salt = encrypted.slice(0,salt_len)
    this.iv = encrypted.slice(0+salt_len,salt_len+iv_len)
    this.secretKey = await this.generatePBKDF2(password)

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv:this.iv },
      this.secretKey,
      encrypted.slice(salt_len + iv_len)
    );

    decryptedString = this.decoder.decode(decrypted)
    console.log(decryptedString)

    return decryptedString
  }

  private async generatePBKDF2(password, salt = this.salt, iterations = 100000, length = 256, hash = 'SHA-256', algorithm = 'AES-CBC'):Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      {name: 'PBKDF2'},
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations,
        hash
      },
      keyMaterial,
      { name: algorithm, length },
      false, // we don't need to export our key!!!
      ['encrypt', 'decrypt']
    );
  }

  private toBase64(buffer):string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private fromBase64(buffer):Uint8Array {
    return Uint8Array.from(atob(buffer), c => c.charCodeAt(0));
  }

}

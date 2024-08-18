import { AuthorKeypair, ShareAddress, SharedSettings, ShareKeypair } from "earthstar"

export type EarthstarDocPath = string
export type EarthstarAuthorAddress = string

export type EarthstarProfile = {
    author:AuthorKeypair,
    shares: {shareAddress:ShareAddress, shareSecret?:string}[]
    displayName?:string
}

export type FieldMapping = {
    id?:EarthstarDocPath,
    sourceName:string,
    isCoreSource?:boolean,
    fields: object,
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}

export type ExportLog = { 
    id?:EarthstarDocPath,
    title:string,
    description?:string,
    fileName:string,
    fileExtension:string,
    fileData?:Blob,
    remoteURL?:string,
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}
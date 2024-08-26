import { AuthorKeypair, ShareAddress } from "earthstar"

export type EarthstarDocPath = string
export type EarthstarAuthorAddress = string

export type EarthstarProfile = {
    author:AuthorKeypair,
    shares: {shareAddress:ShareAddress, shareSecret?:string}[]
    displayName?:string,
    syncServerURL?:string
}

//version 1.0
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

//version 1.0
export type ExportLog = { 
    id?:EarthstarDocPath,
    title:string,
    description?:string,
    fileName:string,
    fileExtension:string,
    fileData?:Blob,
    importSourceURL?:string,
    appliedFieldMappingID?:string,
    appliedKeywordIDs?:string[],
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}

//version 1.0
export type Keyword = {
    id?:EarthstarDocPath,
    word:string,
    variants?:string[]
    isActive:boolean
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}
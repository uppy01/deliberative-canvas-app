import { AuthorKeypair, ShareAddress } from "earthstar"

export type SchemaMutation = {
    schemaName:string,
    id?:EarthstarDocPath
    operation:string,
}

export type EarthstarDocPath = string
export type EarthstarAuthorAddress = string

export type EarthstarProfile = {
    author:AuthorKeypair,
    shares: {shareAddress:ShareAddress, shareSecret?:string}[]
    displayName?:string,
    syncServerURL?:string
}

export type Deliberation = {
    id?:EarthstarDocPath,
    title:string,
    description?:string,
    startDate?:Date | number,
    endDate?:Date | number,
    tags?:string[],
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}

//version 1.0
export type FieldMapping = {
    id?:EarthstarDocPath,
    sourceName:string,
    sourceFormat?:string,
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

//version 1.0
export type CanvasView = {
    id?:EarthstarDocPath,
    title:string,
    description?:string,
    embedURL?:string,
    projectURL?:string,
    exportLogIDs:string[],
    fileExtension?:string,
    fileData?:Blob,
    dateCreated?:Date | number,
    dateUpdated?:Date | number,
    createdBy?:EarthstarAuthorAddress,
    updatedBy?:EarthstarAuthorAddress
}
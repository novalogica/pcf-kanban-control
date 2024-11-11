import { UniqueIdentifier } from "./unique-identifier.type"

export interface CardItem {
  id: UniqueIdentifier,
  column: UniqueIdentifier,
  title: CardInfo,
  [key: string]: CardInfo | UniqueIdentifier,
  tag: CardInfo,
}

export interface CardInfo {
  label: string,
  value: MultiType
}

export type MultiType = (
  string
  | number 
  | boolean 
  | Date 
  | number[] 
  | ComponentFramework.EntityReference 
  | ComponentFramework.LookupValue 
  | ComponentFramework.EntityReference[] 
  | ComponentFramework.LookupValue[]
)

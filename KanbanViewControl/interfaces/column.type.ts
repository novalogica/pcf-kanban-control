import { CardItem } from "./card.type";
import { UniqueIdentifier } from "./unique-identifier.type";

export interface ColumnItem {
  id: UniqueIdentifier,
  title: string,
  cards?: CardItem[]
}
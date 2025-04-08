import * as React from "react";
import Card from "../card/Card";
import ColumnHeader from "./ColumnHeader";
import { ColumnItem } from "../../interfaces";
import { isNullOrEmpty } from "../../lib/utils";
import NoResults from "../container/no-results";

const Column = ({ column }: { column: ColumnItem }) => {
  return (
    <div className="column-container">
      <ColumnHeader column={column} />
      <div className="cards-wrapper">
        {
          !isNullOrEmpty(column.cards) && column.cards!.length > 0 && column.cards?.map((item, index) => (
            <Card key={item.id} item={item} />
          ))
        }
        {
          isNullOrEmpty(column.cards) || column.cards!.length <= 0 && <NoResults />
        }
      </div>
    </div>
  );
}

export default Column;
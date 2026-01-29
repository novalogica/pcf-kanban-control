import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import CardHeader from "./CardHeader";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo, useCallback } from "react";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";

interface IProps {
  item: CardItem;
  draggable?: boolean;
}

const Card = ({ item, draggable = true }: IProps) => {
  const { context, openFormWithLoading } = useContext(BoardContext);

  const onCardClick = useCallback(() => {
    openFormWithLoading(context.parameters.dataset.getTargetEntityType(), item.id.toString());
  }, [context, item.id, openFormWithLoading]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardClick();
      }
    },
    [onCardClick]
  );

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter(
      (i) => i[0] != "title" && i[0] != "tag" && i[0] != "id" && i[0] != "column"
    );
  }, [item]);

  const isClickable = !draggable;

  return (
    <div
      className={`card-container${draggable ? "" : " no-drag"}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onCardClick : undefined}
      onKeyDown={isClickable ? onKeyDown : undefined}
    >
      <CardHeader>
        <Text className="card-title" nowrap>
          {item?.title?.value}
        </Text>
      </CardHeader>
      <CardBody>
        <CardDetailsList>
          {cardDetails?.map((info) => (
            <CardDetails
              key={`${info[0]}-${item.id}`}
              id={item.id}
              info={info[1] as CardInfo}
            />
          ))}
        </CardDetailsList>
      </CardBody>
    </div>
  );
}

export default Card;
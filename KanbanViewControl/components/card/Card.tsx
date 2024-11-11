import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import CardHeader from "./CardHeader";
import CardFooter from "./CardFooter";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo } from "react";

interface IProps {
  item: CardItem,
}

const Card = ({ item }: IProps) => {

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter(i => i[0] != 'title' && i[0] != 'tag' && i[0] != 'id' && i[0] != 'column')
  }, [item])

  return ( 
    <div className="card-container">
      <CardHeader>
        <Text className="card-title" nowrap>{item.title.value}</Text>
      </CardHeader>
      <CardBody>
        <CardDetailsList>
          {
            cardDetails?.map((info) => (
              <CardDetails key={`${info[0]}-${item.id}`} id={item.id} info={info[1] as CardInfo} />
            ))
          }
        </CardDetailsList>
      </CardBody>
      <CardFooter>
        <Text className="card-text card-tag" variant="xSmall" nowrap>{item.tag.value}</Text>
      </CardFooter>
    </div>
  );
}

export default Card;
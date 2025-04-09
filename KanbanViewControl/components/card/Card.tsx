import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import CardHeader from "./CardHeader";
import CardFooter from "./CardFooter";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo } from "react";
import IconButton from "../button/IconButton";
import { useNavigation } from "../../hooks/useNavigation";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";

interface IProps {
  item: CardItem,
}

const Card = ({ item }: IProps) => {
  const { context } = useContext(BoardContext);
  const { openForm } = useNavigation(context);

  const onCardClick = () => {
      openForm(context.parameters.dataset.getTargetEntityType(), item.id.toString())  
  }

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter(i => i[0] != 'title' && i[0] != 'tag' && i[0] != 'id' && i[0] != 'column')
  }, [item])

  const getBackgroundColor = (item : any) => {
    const ratingValue = item?.osm_opportunityratingcode.value;
    if (ratingValue !== undefined && ratingValue !== null) {
      if (ratingValue == 'Cold') {
        return '#e5f8fa';
      } else if (ratingValue == 'Warm') {
        return '#fff2cd';
      } else {
        return '#fcd9d6';
      }
    }
    return ''; // Default background color if rating is not available
  };

  return ( 
    <div className="card-container" style={{ backgroundColor: getBackgroundColor(item)}}>
      <CardHeader>
        <Text className="card-title" nowrap>{item?.title?.value}</Text>
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
        <IconButton iconName="ChevronRight" cursor="pointer" noBorder onClick={onCardClick} />
      </CardFooter>
    </div>
  );
}

export default Card;
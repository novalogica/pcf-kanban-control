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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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

  const getCardTags = (item: any) => {
    const tags = []
    const estCloseDateValue = item?.osm_estimatedclosedate.value;
    const estRevenueValueString = item?.osm_estimatedvalue.value;

    let daysLeftToClose: number | undefined | null;

    if (estCloseDateValue) {
      // Assuming osm_estimatedclosedate.value is an ISO 8601 UTC date string
      const estimatedCloseDate = dayjs.utc(estCloseDateValue);
      const todayUTC = dayjs.utc();

      const differenceInDays = estimatedCloseDate.diff(todayUTC, 'day');
      daysLeftToClose = differenceInDays;
    }

    if (daysLeftToClose !== undefined && daysLeftToClose !== null) {
      if (daysLeftToClose < 10) {
        tags.push({ name: 'Urgent', color: 'red' })
      }
    }

    let estRevenueValueNumber: number | undefined;

    if (estRevenueValueString) {
      // Remove the currency symbol and commas, then parse as a float
      const cleanedRevenueString = estRevenueValueString.replace('₹', '').replace('$','').replace(/,/g, '');
      estRevenueValueNumber = parseFloat(cleanedRevenueString);

      console.log(estRevenueValueNumber)

      if (!isNaN(estRevenueValueNumber)) {
        if (estRevenueValueNumber > 5000) {
          tags.push({ name: 'High Value', color: 'green' });
        }
      }
    }
    console.log(tags)
    return tags;
  };

  return (
    <div className="card-container">
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
        <div>
          {
            getCardTags(item).map(tag => {
              return (
                <span key={tag.name} className="text-badge" style={{ backgroundColor: tag.color }}>{tag.name}</span>
              )
            })
          }
        </div>

        <IconButton iconName="ChevronRight" cursor="pointer" noBorder onClick={onCardClick} />
      </CardFooter>
    </div>
  );
}

export default Card;
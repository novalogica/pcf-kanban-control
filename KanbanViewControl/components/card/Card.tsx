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
    // console.log(context)
    openForm(context.parameters.dataset.getTargetEntityType(), item.id.toString())
  }

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter(i => i[0] != 'title' && i[0] != 'tag' && i[0] != 'id' && i[0] != 'column')
  }, [item])

  const getBackgroundColor = (item: any) => {
    try {
      const estRevenueValueString = item?.tgm_actualrevenue.value;

      let estRevenueValueNumber: number | undefined;

      if (estRevenueValueString !== undefined && estRevenueValueString !== null) {
        const cleanedRevenueString = estRevenueValueString.substring(1).replace(/,/g, '');
        estRevenueValueNumber = parseFloat(cleanedRevenueString);

        if (estRevenueValueNumber >= 0 && estRevenueValueNumber < 100000) {
          return '#ccedfc';
        } else if (estRevenueValueNumber >= 100000 && estRevenueValueNumber < 1000000) {
          return '#fff2cd';
        } else return '#fbc6c2';
      }
    } catch (e) { console.log(e) }
    return '';
  };

  const getCardTags = (item: any) => {
    // console.log('item', item)
    const tags = []

    let estCloseDateValue: string | undefined | null
    let estRevenueValueString: string | undefined | null

    try {
      estCloseDateValue = item?.tgmsl_estclosedate.value;
      estRevenueValueString = item?.tgm_actualrevenue.value;
    } catch (e) { console.log(e) }

    // console.log('gct', estCloseDateValue, estRevenueValueString)

    let daysLeftToClose: number | undefined | null;

    if (estCloseDateValue !== undefined && estCloseDateValue !== null) {
      // Assuming osm_estimatedclosedate.value is an ISO 8601 UTC date string
      const splitDate = estCloseDateValue.split('/');
      const finalFormatDate = splitDate[1] + '/' + splitDate[0] + '/' + splitDate[2]
      const estimatedCloseDate = dayjs.utc(finalFormatDate);
      // console.log(estCloseDateValue, estimatedCloseDate)
      const todayUTC = dayjs.utc();

      const differenceInDays = estimatedCloseDate.diff(todayUTC, 'day');
      daysLeftToClose = differenceInDays;
    }

    if (daysLeftToClose !== undefined && daysLeftToClose !== null) {
      console.log('daysLeftToClose', daysLeftToClose)
      if (daysLeftToClose < 0) {
        tags.push({ name: 'Overdue', color: '#b2b2b2' });
      } else if (daysLeftToClose < 10) {
        tags.push({ name: 'Urgent', color: '#f5554a' })
      }
    }

    let estRevenueValueNumber: number | undefined;

    if (estRevenueValueString !== undefined && estRevenueValueString !== null) {
      // Remove the currency symbol and commas, then parse as a float
      const cleanedRevenueString = estRevenueValueString.substring(1).replace(/,/g, '');
      estRevenueValueNumber = parseFloat(cleanedRevenueString);

      console.log(estRevenueValueNumber)

      if (!isNaN(estRevenueValueNumber)) {
        if (estRevenueValueNumber >= 1000000) {
          tags.push({ name: 'High Value', color: '#5db761' });
        }
      }
    }
    // console.log(tags)
    return tags;
  };

  return (
    <div className="card-container" style={{ backgroundColor: getBackgroundColor(item) }}>
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
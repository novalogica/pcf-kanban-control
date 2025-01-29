/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { Board } from './components';
import { useMemo, useState } from 'react';
import { BoardContext } from './context/board-context';
import { ColumnItem, ViewItem, ViewEntity } from './interfaces';
import Loading from './components/container/loading';
import { Toaster } from 'react-hot-toast';
import { useDataverse } from './hooks/useDataverse';
import { getColumnValue } from './lib/utils';
import { unlocatedColumn } from './lib/constants';

interface IProps {
  context: ComponentFramework.Context<IInputs>,
  notificationPosition: "top-center" | "top-left" | "top-right" | "bottom-center" | "bottom-left" | "bottom-right",
}

const App = ({ context, notificationPosition } : IProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeView, setActiveView] = useState<ViewItem | undefined>();
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [entities, setEntities] = useState([]);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [viewsEntity, setViewsEntity] = useState<ViewEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
  const [activeViewEntity, setActiveViewEntity] = useState<ViewEntity | undefined>();
  const { getOptionSets, getBusinessProcessFlows } = useDataverse(context);
  const { dataset } = context.parameters;
  

  const handleViewChange = () => {
    if(activeView === undefined || activeView.columns === undefined)
      return

    const cards: any[] = filterRecords(activeView)

    let activeColumns = activeView?.columns ?? []

    if(activeView.type != "BPF" && (cards.some(card => !(activeView.key in card)) || cards.some(card => card[activeView.key]?.value === ""))){
        activeColumns = [
          unlocatedColumn,
          ...activeColumns
        ]
    }

    const columns = activeColumns.map((col) => {
      return { 
        ...col, 
        cards: cards.filter((card: any) => card?.column == col.id) 
      }
    })
    setColumns(columns)
  }

  const handleColumnsChange = async () => {
    const options = await getOptionSets(undefined);
    const recordIds = Object.keys(dataset.records);
    const process = await getBusinessProcessFlows(dataset.getTargetEntityType(), recordIds)
    const allViews = [
      ...options ?? [],
      ...process ?? []
    ]
    if(allViews === undefined)
      return;
    setViews(allViews);
    
    if(activeView != undefined){
      setActiveView(allViews.find((view) => view.key === activeView.key));
      handleViewChange()
    }else{
      setActiveView(allViews[0] ?? []);
    }

    setIsLoading(false);
  }

  useMemo(() => {
    setSelectedEntity(dataset.getTargetEntityType())
    handleColumnsChange()
  }, [context.parameters.dataset.columns])

  const filterRecords = (activeView: ViewItem) => {
    return Object.entries(dataset.records).map(([id, record]) => {

      const columnValues = dataset.columns.reduce((acc, col, index) => {
        if(col.name === activeView.key){
          const targetColumn = activeView.columns !== undefined ? activeView.columns.find(column => column.title === record.getFormattedValue(col.name)) : {id: null};
          const key = targetColumn ? targetColumn.id : "unallocated";
          acc = {...acc, column: key}
        }

        if(activeView.type === "BPF"){
          const key = activeView.records?.find(val => val.id === id)?.stageName ?? ""
          acc = {...acc, column: key}
        }

        const name = index === 0 ? "title" : col.name;

        const columnValue = getColumnValue(record, col);
        return { ...acc, [name]: columnValue };
      }, {});

      return { id, ...columnValues };

    })
  }
  
  useMemo(handleViewChange, [activeView])

  if(isLoading) {
    return <Loading />
  }

  return (
    <BoardContext.Provider value={{ context, views, activeView, setActiveView, columns, setColumns, activeViewEntity ,setActiveViewEntity, selectedEntity }}>
        <Board />
        <Toaster 
          position={notificationPosition} 
          reverseOrder={false} 
          toastOptions={{
            style: { borderRadius: 4, padding: 16 },
            duration: 5000
          }} 
        />
    </BoardContext.Provider>
  )
}

export default App;
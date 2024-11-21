/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { Board, ModalPop } from './components';
import { useEffect, useMemo, useState } from 'react';
import { BoardContext } from './context/board-context';
import { ColumnItem, ViewItem, ViewEntity } from './interfaces';
import { mockCards, mockColumns } from './mock/data';
import Loading from './components/container/loading';
import { DataType } from './enums/data-type';
import { Toaster } from 'react-hot-toast';
import { useDataverse } from './hooks/useDataverse';

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
  const [activeViewEntity, setActiveViewEntity] = useState<ViewEntity | undefined>();
  const { getEntities, getStatusMetadata, generateViewTypes, getViewsAndFields, getOptionSets } = useDataverse(context);
  
  /*const views = useMemo(() => {
    console.log("[Entity View Changed]")

    const datasetColumns = context.parameters.dataset.columns.filter(c => {
      return c.dataType == DataType.OptionSet
    });

    return datasetColumns.map((col) => ({
      key: col.name,
      text: col.displayName,
      type: col.dataType
    }));
    
  }, [context.parameters.dataset.columns])*/

  const filterRecords = (data: any) => {
    const { records, fields } = data;
    const columnKey = activeView?.key

    // Dynamically filter records
    return records.map((record: any) => {
        const filteredRecord: any = {};

        filteredRecord["id"] = record[`${data.entity}id`];
        filteredRecord["tag"] = {label: "", value: ""}
        filteredRecord["description"] = {label: "", value: ""}
        filteredRecord["ownerid"] = {
          "label": "Owner",
          "value": {
            id: {
              guid: record["_ownerid_value"]
            },
            name: "Unknown",
            etn: "systemuser"
          }
        };
        filteredRecord["column"] = record[columnKey ?? ""]

        // Include fields based on the fields list
        fields.forEach((field: any) => {
            // eslint-disable-next-line no-prototype-builtins
            if (record.hasOwnProperty(field.name)) {
                if(field.name.includes("title")){
                  filteredRecord["title"] = {
                    label: field.displayName,
                    value: record[field.name]
                  };
                }else{
                  filteredRecord[field.name] = {
                    label: field.displayName,
                    value: record[field.name]
                  };
                }
            }
        });

        return filteredRecord;
    });
  }


  useMemo(() => {
    if(activeView === undefined)
      return

    //console.log("activeView", activeView)
    //console.log("activeViewEntity", activeViewEntity)

    const cards = filterRecords(activeViewEntity)
    console.log(cards)
    const activeColumns = activeView?.columns ?? []

    const columns = activeColumns.map((col) => {
      return { 
        ...col, 
        cards: cards.filter((card: any) => card.column == col.id) 
      }
    })

    setColumns(columns)
  }, [activeView])

  

  useEffect(() => {
    //console.log(context.parameters.dataset.columns);

    /*const columns = mockColumns.map((col) => {
      return { 
        ...col, 
        cards: mockCards.filter((card) => card.column == col.id) 
      }
    })

    setColumns(columns);*/

    const fetchEntities = async () => {
      try {
          const entities = await getEntities();
          console.log("Fetched entities:", entities);
          setEntities(entities);

          setShowModal(true);
          setIsLoading(false);
      } catch (error) {
          console.error("Error fetching entities:", error);
      }
    };

    fetchEntities();
    
  }, [])

  const fetchViews = async (logicalName: string) => {
    const views = await getViewsAndFields(logicalName);
    setViewsEntity(views);
    return views;
  }

  const handleEntitySave = async () => {
    console.log(activeViewEntity)

    const options = await getOptionSets(activeViewEntity);
    if(options === undefined)
      return;
    setViews(options);
    setActiveView(options[0] ?? []);
    //setColumns(options[0].columns);
    setIsLoading(false);
    setShowModal(false);
  }

  
  if(isLoading) {
    return <Loading />
  }

  if(showModal){
    return <ModalPop
      setActiveViewEntity={setActiveViewEntity}
      handleEntitySave={handleEntitySave}
      views={viewsEntity}
      entities={entities}
      fetchViews={fetchViews}/>
  }

  return (
    <BoardContext.Provider value={{ context, views, activeView, setActiveView, columns, setColumns, viewsEntity, activeViewEntity ,setActiveViewEntity }}>
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
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
import { consoleLog, getColumnValue, isLocalHost } from './lib/utils';

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
  const { getEntities, getViewsAndFields, getOptionSets } = useDataverse(context);
  const { dataset } = context.parameters;
  

  const handleColumnsChange = async () => {
    const options = await getOptionSets(undefined);

    if(options === undefined)
      return;
    setViews(options);
    setActiveView(options[0] ?? []);

    setIsLoading(false);
  }


  useMemo(() => {
    console.log("[Entity View Changed]")
    setSelectedEntity(dataset.getTargetEntityType())

    consoleLog("columns", dataset.columns, {anyWhereDebug: true})
    console.log("records", dataset.records)

    handleColumnsChange()
    
  }, [context.parameters.dataset.columns])

  /**
   * Localhost function
   * @param data 
   * @returns all the cards ready to be displayed on the columns
   */
  const filterRecords = (data: any) => {
    const { records, fields } = data;
    const columnKey = activeView?.key

    // Dynamically filter records
    return records.map((record: any) => {
        const filteredRecord: any = {};

        filteredRecord["id"] = record[`${data.entity}id`];
        filteredRecord["tag"] = {label: "", value: ""}
        //filteredRecord["description"] = {label: "", value: ""}
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
            if (record.hasOwnProperty(field.name) && record[field.name] != undefined) {
              const rec = views.find(item => item.uniqueName == field.name)
                if(rec && rec.columns){
                  const value = rec.columns.find(item => item.id == record[field.name])
                  filteredRecord[field.name] = {
                    label: field.displayName,
                    value: value?.title
                  };
                }else{
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
            }
        });

        return filteredRecord;
    });
  }


  useMemo(() => {
    if(activeView === undefined || activeView.columns === undefined)
      return

    console.log("[Changed View]")

    //console.log("activeView", activeView)
    //console.log("activeViewEntity", activeViewEntity)
    let cards: any[]

    if(isLocalHost){
      cards = filterRecords(activeViewEntity)
    }else{
      cards = Object.entries(dataset.records).map(([id, record]) => {

        const columnValues = dataset.columns.reduce((acc, col) => {
          if(col.name === activeView.key){
            const targetColumn = activeView.columns !== undefined ? activeView.columns.find(column => column.title === record.getFormattedValue(col.name)) : {id: null};
            const key = targetColumn ? targetColumn.id : null;
            acc = {...acc, column: key}
          }

          const name = col.name.includes("title") ? "title" : col.name; 
  
          const columnValue = getColumnValue(record, col);
          return { ...acc, [name]: columnValue };
        }, {});
  
        return { id, ...columnValues };
  
      })
    }

    console.log("cards", cards)
    const activeColumns = activeView?.columns ?? []

    const columns = activeColumns.map((col) => {
      return { 
        ...col, 
        cards: cards.filter((card: any) => card?.column == col.id) 
      }
    })
    console.log("columns", columns)
    setColumns(columns)
  }, [activeView])

  

  useEffect(() => {
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

    if(isLocalHost)
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

    setIsLoading(false);
    setShowModal(false);
  }

  
  if(isLoading) {
    return <Loading />
  }

  if(showModal){
    return <ModalPop
      selectedEntity={selectedEntity}
      setSelectedEntity={setSelectedEntity}
      setActiveViewEntity={setActiveViewEntity}
      handleEntitySave={handleEntitySave}
      views={viewsEntity}
      entities={entities}
      fetchViews={fetchViews}/>
  }

  return (
    <BoardContext.Provider value={{ context, views, activeView, setActiveView, columns, setColumns, viewsEntity, activeViewEntity ,setActiveViewEntity, selectedEntity }}>
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
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
import { consoleLog, getColumnValue, isLocalHost, unlocatedColumn } from './lib/utils';

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
  const { getEntities, getViewsAndFields, getOptionSets, getBusinessProcessFlows } = useDataverse(context);
  const { dataset } = context.parameters;
  

  const handleViewChange = () => {
    if(activeView === undefined || activeView.columns === undefined)
      return

    consoleLog("[Changed View]")
    consoleLog(activeView)

    let cards: any[]

    if(isLocalHost){
      cards = filterRecordsLocalhost(activeViewEntity)
    }else{
      cards = filterRecords(activeView)
    }

    consoleLog("cards", cards)
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
    consoleLog("columns", columns)
    setColumns(columns)
  }

  const handleColumnsChange = async () => {
    const options = await getOptionSets(undefined);
    const recordIds = Object.keys(dataset.records);
    const process = await getBusinessProcessFlows(dataset.getTargetEntityType(), recordIds)
    consoleLog("process", process)
    const allViews = [
      ...options ?? [],
      ...process ?? []
    ]
    consoleLog(allViews)
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
    if(isLocalHost)
      return;

    consoleLog("[Entity View Changed]")
    setSelectedEntity(dataset.getTargetEntityType())

    consoleLog("columns", dataset.columns, {anyWhereDebug: true})
    consoleLog("records", dataset.records)

    handleColumnsChange()
    
  }, [context.parameters.dataset.columns])

  /**
   * Localhost function
   * @param data 
   * @returns all the cards ready to be displayed on the columns
   */
  const filterRecordsLocalhost = (data: any) => {
    const { records, fields } = data;
    const columnKey = activeView?.key

    console.log(records)
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
        if(activeView?.type === "BPF"){
          filteredRecord["column"] = activeView.records?.find(val => val.id === record[`${data.entity}id`])?.stageName ?? ""
        }else{
          filteredRecord["column"] = record[columnKey ?? ""] ?? "unallocated"
        }
        

        // Include fields based on the fields list
        fields.forEach((field: any, index: number) => {
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
                  if(index == 0){
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
  

  /**
   * On View change
   */
  useMemo(() => {
    handleViewChange()
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
    const viewsEntities = await getViewsAndFields(logicalName);
    setViewsEntity(viewsEntities);

    return viewsEntities;
  }

  const handleEntitySave = async () => {
    console.log(activeViewEntity)

    const options = await getOptionSets(activeViewEntity);
    
    const recordIds = viewsEntity[0].records.map(record => record[`${activeViewEntity?.entity}id`]);
    consoleLog("rr", `${activeViewEntity?.entity}id`)
    consoleLog("recordsIds", recordIds)
    const process = await getBusinessProcessFlows(selectedEntity as string, recordIds)
    console.log("process", process)
    const allViews = [
      ...options ?? [],
      ...process
    ]
    console.log("views", allViews)
    console.log("ViewsOptions", options)
    if(allViews === undefined)
      return;
    setViews(allViews);
    setActiveView(allViews[0] ?? []);

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
import * as React from 'react';
import { IInputs } from './generated/ManifestTypes';
import { Board } from './components';
import { useEffect, useMemo, useState } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { BoardContext } from './context/board-context';
import { ColumnItem, ViewItem } from './interfaces';
import { mockCards, mockColumns } from './mock/data';
import Loading from './components/container/loading';
import { DataType } from './enums/data-type';
import { Toaster } from 'react-hot-toast';

interface IProps {
  context: ComponentFramework.Context<IInputs>,
  notificationPosition: "top-center" | "top-left" | "top-right" | "bottom-center" | "bottom-left" | "bottom-right",
}

const App = ({ context, notificationPosition } : IProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewItem | undefined>();
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  
  const views = useMemo(() => {
    const datasetColumns = context.parameters.dataset.columns.filter(c => {
      return c.dataType == DataType.OptionSet
    });

    return datasetColumns.map((col) => ({
      key: col.name,
      text: col.displayName,
      type: col.dataType
    }));
  }, [context.parameters.dataset.columns])

  useEffect(() => {
    const columns = mockColumns.map((col) => {
      return { 
        ...col, 
        cards: mockCards.filter((card) => card.column == col.id) 
      }
    })

    setColumns(columns);
    setIsLoading(false);
  }, [activeView])
  
  if(isLoading) {
    return <Loading />
  }

  return (
    <BoardContext.Provider value={{ context, views, activeView, setActiveView, columns, setColumns }}>
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
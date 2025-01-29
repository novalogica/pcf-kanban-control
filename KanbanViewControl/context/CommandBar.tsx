import * as React from "react";
import KanbanDropdown from "../components/dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react";
import { BoardContext } from "./board-context";
import { useContext, useMemo } from "react";
import { CardInfo } from "../interfaces";

const CommandBar = () => {
  const { columns, setColumns, context, views, activeView, setActiveView, activeViewEntity, setActiveViewEntity } = useContext(BoardContext);
  
  const fields = useMemo(() => context.parameters.dataset.columns.map((item) => {
    return { key: item.name, text: item.displayName }
  }), [])


  const onSortByChanged = (item: IDropdownOption) => {
    console.log(item);
    const copy = [...columns];
    const schemaName = item.key as string;
    
    const sorted = copy.map((col) => {
      return { ...col, cards: col.cards?.sort((a,b) => {
        const itemA = (a[schemaName] as CardInfo).value;
        const itemB = (b[schemaName] as CardInfo).value;

        if (typeof itemA === 'number' && typeof itemB === 'number') {
          return itemA - itemB;
        } else if (typeof itemA === 'string' && typeof itemB === 'string') {
          return itemA.localeCompare(itemB);
        } else {
          return 0
        }
      }) }
    })

    setColumns(sorted);
  }

  const onSortOrderChanged = (item: IDropdownOption) => {
    console.log(item);
  }

  return ( 
    <div className="kanban-commandar-bar">
      <KanbanDropdown 
        key="view-dropdown" 
        label="View by" 
        options={views} 
        selectedOption={activeView}
        onOptionSelected={setActiveView}/>
      <div className="commandar-bar-dropdowns">
        <KanbanDropdown 
          key="sort-dropdown" 
          label="Sort by" 
          options={fields} 
          onOptionSelected={onSortByChanged} />
        
        <KanbanDropdown 
          key="sort-order-dropdown" 
          label="Sort Order" 
          options={[
            { key: 'sort-ascending', text: 'Ascending 🔼' },
            { key: 'sort-descending', text: 'Descending 🔽' },
          ]} 
          onOptionSelected={onSortOrderChanged}/>
      </div>
    </div>
  );
}

export default CommandBar;
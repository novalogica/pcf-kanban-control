import * as React from "react";
import KanbanDropdown from "../components/dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react";
import { BoardContext } from "./board-context";
import { useContext, useEffect, useMemo, useState } from "react";
import { CardInfo } from "../interfaces";
import { isLocalHost } from '../lib/utils';

const CommandBar = () => {
  const { columns, setColumns, context, views, activeView, setActiveView, viewsEntity, activeViewEntity ,setActiveViewEntity } = useContext(BoardContext);
  
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

  const handleViewEntityChange = (option?: IDropdownOption) => {
    const view = viewsEntity.find((val) => val.key === option?.key)
    setActiveViewEntity(view)
};

  return ( 
    <div className="kanban-commandar-bar">
      <KanbanDropdown 
        key="view-dropdown" 
        label="View by" 
        options={views} 
        selectedOption={activeView}
        onOptionSelected={setActiveView}/>
    {isLocalHost
    ?
    <KanbanDropdown 
        key="view-entity" 
        label="Entity View" 
        options={viewsEntity} 
        selectedOption={activeViewEntity}
        onOptionSelected={handleViewEntityChange}/>
    :
    <></>
    }
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
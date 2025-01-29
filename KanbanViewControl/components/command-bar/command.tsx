import * as React from "react";
import KanbanDropdown from "../dropdown/Dropdown";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";

const CommandBar = () => {
  const { views, activeView, setActiveView } = useContext(BoardContext);
  
  return ( 
    <div className="kanban-commandar-bar">
      <KanbanDropdown 
        key="view-dropdown" 
        label="View by" 
        options={views} 
        selectedOption={activeView}
        onOptionSelected={setActiveView}/>
    </div>
  );
}

export default CommandBar;
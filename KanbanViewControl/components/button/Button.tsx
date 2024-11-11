import * as React from "react";
import { ActionButton } from "@fluentui/react/lib/Button";

interface IProps {
  label: string,
  iconName: string
  onClick: () => void
} 

const KanbanButton = ({ label, iconName, onClick }: IProps) => {
  return ( 
    <ActionButton 
      className="action-button"
      text={label}
      iconProps={{ iconName: iconName }}
      size={24} 
      onClick={onClick}
    />
  );
}

export default KanbanButton;
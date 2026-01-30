import * as React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { dropdownStyles } from "./styles";

interface IProps {
  label: string,
  placeholder?: string,
  selectedOption?: IDropdownOption,
  options: IDropdownOption[]
  onOptionSelected: (option: IDropdownOption) => void
}

const KanbanDropdown = ({ label, placeholder, selectedOption, options, onOptionSelected }: IProps) => {
  const [selectedItem, setSelectedItem] = React.useState<IDropdownOption | undefined>(selectedOption);

  React.useEffect(() => {
    setSelectedItem(selectedOption);
  }, [selectedOption?.key, selectedOption?.text]);

  const onChange = (_: React.FormEvent<HTMLDivElement>, item?: IDropdownOption): void => {
    if(!item) {
      return;
    }

    setSelectedItem(item);
    onOptionSelected(item)
  };
  
  return (
    <Dropdown
      className="kanban-dropdown"
      styles={dropdownStyles}
      placeholder={placeholder ?? "Select an option"}
      selectedKey={selectedItem ? selectedItem.key : undefined}
      label={label}
      options={options}
      onChange={onChange} />
  );
}

export default KanbanDropdown;
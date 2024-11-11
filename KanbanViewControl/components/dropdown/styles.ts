import { IDropdownStyles } from "@fluentui/react/lib/Dropdown";

export const dropdownStyles: Partial<IDropdownStyles> = { 
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'start'
  },
  dropdown: { 
      width: 200,
      textAlign: 'left',
      border: 'none'
  },
  label: {
      color: '#595959',
      textAlign: 'left',
      fontSize: 12,
      fontWeight: 700,
  },
};
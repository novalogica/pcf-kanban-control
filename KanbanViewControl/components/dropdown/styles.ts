import { IDropdownStyles } from "@fluentui/react/lib/Dropdown";

export const dropdownStyles: Partial<IDropdownStyles> = { 
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'start'
  },
  dropdown: { 
      width: 'auto',
      textAlign: 'left',
      border: 'none'
  },
  title: {
    /* Feste Höhe inkl. Border (32 + 2px) verhindert Layout-Versatz bei open/focus */
    minHeight: 34,
    height: 34,
    boxSizing: 'border-box',
  },
  label: {
      color: '#595959',
      textAlign: 'left',
      fontSize: 12,
      fontWeight: 700,
  },
};
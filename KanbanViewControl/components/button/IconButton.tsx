import { IButtonStyles, IconButton as IconBtn } from "@fluentui/react/lib/Button";
import * as React from "react";

interface IProps  {
  iconName: string,
  color?: string
  noBorder?: boolean,
  cursor?: string,
  onClick?: () => void;
}

const IconButton = ({ iconName, color, noBorder, onClick }: IProps) => {
  const button: IButtonStyles = {
    root: {
      width: 32,
      height: 32,
      padding: 4,
      borderRadius: 10,
      border: noBorder ? undefined : `2px solid ${color ?? "#70a970" }`,
      color: color ?? '#70a970',
    },
    iconHovered : {
      color: color ?? '#70a970',
      opacity: 0.8
    },
    rootHovered: {
      color: color ?? '#70a970',
      opacity: 0.8
    }
  }

  return ( 
    <IconBtn 
      styles={button} 
      iconProps={{ iconName: iconName }} 
      onClick={onClick} />
  );
}

export default IconButton;
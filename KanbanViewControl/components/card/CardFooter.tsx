import * as React from "react";
import IconButton from "../button/IconButton";

interface IProps {
  children: React.ReactNode
}

const CardFooter = ({children}: IProps) => {
  return ( 
    <div className="card-footer">
      {children}
      <IconButton iconName="ChevronRight" cursor="pointer" noBorder />
    </div>
  );
}

export default CardFooter;
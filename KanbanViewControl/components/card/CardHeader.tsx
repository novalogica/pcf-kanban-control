import * as React from "react";
import IconButton from "../button/IconButton";

interface IProps {
  children: React.ReactNode,
}

const CardHeader = ({ children }: IProps) => {
  return ( 
    <div className="card-header-container">
      {children}
      <div className="drag-handle">
        {/*<IconButton iconName="More" color="#70a970" noBorder/>*/}
      </div>
    </div>
  );
}

export default CardHeader;
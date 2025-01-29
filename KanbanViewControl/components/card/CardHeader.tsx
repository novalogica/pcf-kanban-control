import * as React from "react";

interface IProps {
  children: React.ReactNode,
}

const CardHeader = ({ children }: IProps) => {
  return ( 
    <div className="card-header-container">
      {children}
    </div>
  );
}

export default CardHeader;
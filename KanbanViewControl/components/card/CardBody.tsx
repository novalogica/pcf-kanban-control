import * as React from "react";

interface IProps {
  children: React.ReactNode
}

const CardBody = ({ children }: IProps) => {
  return ( 
    <div className="card-body">
      {children}
    </div>
  );
}

export default CardBody;
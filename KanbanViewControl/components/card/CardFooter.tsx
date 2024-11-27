import * as React from "react";

interface IProps {
  children: React.ReactNode
}

const CardFooter = ({children}: IProps) => {
  return ( 
    <div className="card-footer">
      {children}
    </div>
  );
}

export default CardFooter;
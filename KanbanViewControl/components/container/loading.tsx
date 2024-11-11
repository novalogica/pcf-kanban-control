import { Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";

const Loading = () => {
  return ( 
    <div className='loading-container'>
      <Spinner label="Loading..." size={SpinnerSize.large} />
    </div>
  );
}

export default Loading;
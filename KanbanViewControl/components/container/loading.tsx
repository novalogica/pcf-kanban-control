import { Spinner, SpinnerSize } from "@fluentui/react";
import * as React from "react";

interface LoadingProps {
  /** Localized label (e.g. "Loading..." / "Laden..."). */
  label?: string;
}

const Loading: React.FC<LoadingProps> = ({ label = "Loading..." }) => {
  return (
    <div className="loading-container">
      <Spinner label={label} size={SpinnerSize.large} />
    </div>
  );
};

export default Loading;
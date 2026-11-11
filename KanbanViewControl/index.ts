import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import App from "./App";
import { logBuildInfo } from "./version";

export class KanbanViewControl implements ComponentFramework.ReactControl<IInputs, IOutputs> {

    constructor() { }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        _: ComponentFramework.Dictionary
    ): void {
        logBuildInfo();
        context.mode.trackContainerResize(true);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        return React.createElement(App, { 
            context,  
            notificationPosition: context.parameters.notificationPosition?.raw
        });

    }

    public getOutputs(): IOutputs {
        return { };
    }

    public destroy(): void {
        // ReactControl: Das Unmounting des von updateView zurückgegebenen Elements
        // übernimmt die PCF-Plattform. Es gibt hier keinen eigenen DOM-Container
        // und keine manuell registrierten Listener, die aufgeräumt werden müssten.
    }
}

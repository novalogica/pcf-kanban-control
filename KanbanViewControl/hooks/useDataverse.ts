import { useMemo } from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { isNullOrEmpty } from '../lib/utils';

export const useDataverse = (context: ComponentFramework.Context<IInputs>) => {
    //@ts-expect-error - Xrm is not recognized localy
    const BASE_URL = Xrm.Utility.getGlobalContext().getClientUrl();
    const { parameters, webAPI: API } = context;
    const entityName = useMemo(() => parameters.dataset.getTargetEntityType(), [])

    const updateRecord = async (item: ComponentFramework.WebApi.Entity) => {
        try {
            const response = await API.updateRecord(
                entityName,
                item.id,
                item
            )

            //Show toast notification with 
        } catch(e) {
            //Show toast notification with error message
        }
    }

    const getStatusMetadata = async () => {
        try {
            const url = `${BASE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')
            /Attributes(LogicalName='statuscode')
            /Microsoft.Dynamics.CRM.StatusAttributeMetadata
            ?$select=LogicalName
            &$expand=OptionSet($select=Options,MetadataId)`; 
            
            const response = await fetch(url, { 
                method: "GET", 
                headers: {
                    "Accept": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                } 
            });

            const result = await response.json();
            const options = result.OptionSet?.Options;

            if(isNullOrEmpty(options))
                return;

            return options;
        } catch (e) {
            console.log(e)
        }
    }

    const getBusinessProcessFlow = () => {
        try {
            //Show toast notification with 
        } catch (e) {
            //Show toast notification with error message
        }
    }

    const getOptionset = () => {
        try {
            //Show toast notification with 
        } catch (e) {
            //Show toast notification with error message
        }
    }

    return {
        updateRecord,
        getStatusMetadata,
        getBusinessProcessFlow,
        getOptionset
    }
}
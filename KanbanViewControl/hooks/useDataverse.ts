/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { isNullOrEmpty, isLocalHost, apiRoutes } from '../lib/utils';
import { ViewEntity, FieldMetadata, ViewItem } from '../interfaces';



export const useDataverse = (context: ComponentFramework.Context<IInputs>) => {
    //@ts-expect-error - Xrm is not recognized localy
    const BASE_URL = typeof Xrm !== 'undefined' ? Xrm.Utility.getGlobalContext().getClientUrl() : "";
    const { parameters, webAPI: API } = context;
    const { dataset } = parameters;
    const entityName = useMemo(() => parameters.dataset.getTargetEntityType(), [])

    const generateViewTypes = async (activeView: ViewEntity | undefined) => {
        const promises = [ getOptionSets(activeView) ];
    
        //if (isBPFEnabled.raw == "0") {
        //    promises.push(getBusinessProcessFlows());
        //}
        
        try{
            const [optionsetViews, bpfViews] = await Promise.all(promises);
            return [
                ...(optionsetViews || []), 
                ...(bpfViews || [])
            ];
        } catch(e) {
            console.error(e);
            return []
        }
    }

    const updateRecord = async (record: any) => {
        try {
            const response = await execute({
                endpoint: `${record.logicalName}(${record.id})`,
                method: "PATCH",
                body: JSON.stringify(record.update)
            });
            return response;
        } catch(e) {
            //Show toast notification with error message
        }
    }

    const getStatusMetadata = async () => {
        try {
            const url = `EntityDefinitions(LogicalName='nl_opportunity')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName,DisplayName&$expand=OptionSet($select=Options,MetadataId)`;


            const metadata = await execute({
                endpoint: url,
                method: "GET"
            })

            console.log("StatusMetadata", metadata)

            const options = metadata.OptionSet?.Options;

            console.log("StatusOptions", options)

            if(isNullOrEmpty(options))
                return;

            return options;
        } catch (e) {
            console.log(e)
        }
    }

    const getBusinessProcessFlow = async () => {
        try {
            const stages = await context.webAPI.retrieveMultipleRecords(
                "processstage",
                `?$select=stagename,processstageid,stagecategory,_processid_value&$filter=primaryentitytypecode eq '${entityName}'&$expand=processid($select=name,uniquename)`
            );
        
            return stages.entities.reduce((accumulator: any, stage) => {
            let process = accumulator.find((p: any) => p.key === stage.processid.workflowid);
            
            const column = {
                key: stage.stagename,
                label: stage.stagename,
                order: stage.stagecategory
            };
            
            if (!process) {
                process = {
                key: stage.processid.workflowid,
                text: stage.processid.name,
                uniqueName: stage.processid.uniquename || undefined,
                type: 'BPF',
                columns: [ column ]
                };
                accumulator.push(process);
            } else {
                process.columns.push(column);
            }
            
            return accumulator;
            }, []);
        } catch (e) {
            //Show toast notification with error message
        }
    }

    const getOptionSets = async (activeView: ViewEntity | undefined) => {
        try {
            let datasetColumns
            if(isLocalHost){
                if(activeView == undefined)
                    return

                datasetColumns = activeView.fields.filter(field => field.dataType == "Picklist" || field.dataType == "Status")
            }else{
                datasetColumns = dataset.columns.filter(col => col.dataType == "OptionSet");
            }
            
            const entityLogicalName = activeView?.entity ?? entityName
            
            console.log("OptionSetsWithoutColumns", datasetColumns)

            if(isNullOrEmpty(datasetColumns) || datasetColumns.length <= 0) {
                return [];
            }

            const filter = datasetColumns.map((column) => `attributename eq '${column.name}'`).join(' or ');

            const columnOptions = isLocalHost ? 
            await execute({endpoint: `stringmaps?$filter=(objecttypecode eq '${entityLogicalName}' and (${filter}))`, method: "GET"})
            : 
            await context.webAPI.retrieveMultipleRecords(
                "stringmap",
                `?$filter=(objecttypecode eq '${entityLogicalName}' and (${filter}))`
            );

            //console.log("columnOptions", columnOptions)

            const columns = datasetColumns.map((column) => {
                const ops = columnOptions.entities ?? columnOptions.value
                const options = ops
                    .filter((option: any) => option.attributename == column.name)
                    .map((option: any) => ({
                        key: option.attributevalue,
                        id: option.attributevalue, 
                        label: option.value,
                        title: option.value, 
                        order: option.displayorder
                    }));

                return {
                    key: column.name,
                    text: column.displayName,
                    uniqueName: column.name,
                    dataType: column.dataType,
                    columns: options
                }
            })

            console.log("OptionSetsWithColumns", columns);

            const sortedColumns = columns.map(item => ({
                ...item,
                columns: item.columns.sort((a: any, b: any) => a.order - b.order)
            }));

            return sortedColumns;
        } catch (e) {
            //Show toast notification with error message
        }
    }

    /**
     *  Localhost Function
     * @returns all the custom entities can be changed to return all of them
     */
    const getEntities = async () => {
        try {
            const entities = await execute({endpoint: "EntityDefinitions?$select=LogicalName,DisplayName", method: "GET"});

            const internalTablePattern = /^(adx_|bot|flow|ai|field|calendar|custom|role|sdk|report|power|retention|relationship|privilege|plugin|organization|git|internal|msdyn_|workflow|system|solution|subscription|import|msfp_|user|trace|time|email|entity|mspp_|canvas|bulk|channel|copilot|mobile|mailbox|metadata|metric|ribbon|saved|search|rollup|process|application|appmodule|dv|duplicate|document)/i;

            const customTables = /^(nl_)/i;

            // Filter out entities whose LogicalName matches the internal or system table pattern
            const filteredEntities = entities.value.filter(function(result: any) {
                return customTables.test(result.LogicalName);
            });

            const entitiesOptions = filteredEntities.map((result: any) => {
                const displayName =
                    result?.DisplayName?.LocalizedLabels?.[0]?.Label || result?.LogicalName || "Unknown";
    
                return {
                    key: result.LogicalName,
                    displayName: displayName,
                    logicalName: result.LogicalName,
                    text: `${displayName} (${result.LogicalName})`,
                };
            });

            return entitiesOptions;
        } catch (e) {
            //Show toast notification with error message
        }
    }

    /**
     *  Localhost Function
     * @returns all the views from the chosen entity and the fields/records
     */
    const getViewsAndFields = async (entityLogicalName: string): Promise<ViewEntity[]> => {
        const logicalNamePluralized = entityLogicalName?.endsWith('y') ? entityLogicalName.slice(0, -1) + 'ies' : entityLogicalName + 's';
        try {
            const systemViews: { value: ViewEntity[] } = await execute({
                endpoint: `savedqueries?$filter=returnedtypecode eq '${entityLogicalName}'&$select=savedqueryid,name,layoutxml`, method: "GET"
            });
            const personalViews: { value: ViewEntity[] } = await execute({
                endpoint: `userqueries?$filter=returnedtypecode eq '${entityLogicalName}'&$select=userqueryid,name,layoutxml`, method: "GET"
            });
            const metadata: { value: any[] } = await execute({
                endpoint: `EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`, method: "GET"
            });
            const records: {value: any[]} = await execute({
                endpoint: logicalNamePluralized, method: "GET"
            })
            // Combine all views
            const allViews = [...systemViews.value, ...personalViews.value];
    
            // Map metadata for quick lookup
            const metadataMap = mapMetadata(metadata.value);
    
            // Process each view
            allViews.forEach((view) => {
                const fields = parseFieldsFromLayoutXml(view.layoutxml).map((field, index) => {
                    const fieldInfo = metadataMap[field] || { type: "Unknown", displayName: field };
                    return {
                        name: field,
                        displayName: fieldInfo.displayName,
                        dataType: fieldInfo.type,
                        alias: field,
                        order: index,
                    };
                });
    
                // Assign fields to the view
                view.entity = entityLogicalName;
                view.records = records.value;
                view.text = view.name;
                view.key = view?.savedqueryid as string ?? view?.userqueryid as string
                view.fields = fields;
            });
            console.log(allViews);
            return allViews;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    const parseFieldsFromLayoutXml = (layoutXml: string): string[] => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(layoutXml, "text/xml");
        const cells = xmlDoc.getElementsByTagName("cell");
        const fields: string[] = [];
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const fieldName = cell.getAttribute("name");
            if (fieldName) fields.push(fieldName);
        }
        return fields;
    }

    const mapMetadata = (metadata: any[]): Record<string, FieldMetadata> => {
        const map: Record<string, FieldMetadata> = {};
        metadata.forEach((attr) => {
            const displayName = attr.DisplayName?.LocalizedLabels?.[0]?.Label || attr.LogicalName;
            map[attr.LogicalName] = { type: attr.AttributeType, displayName };
        });
        return map;
    };

    const execute = async (props: any) => {
        const response = isLocalHost ? await executeLocalhost(props) : await executeLocalhost(props);

        if (!response.ok) {
            const errorMessage = response.status === 401
                ? `${response.status} - Unauthorized`
                : `${response.status} - ${response.statusText}`;
            throw new Error(errorMessage);
        }
    
        const contentType = response.headers.get("content-type");
    
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return response;
        }            
    }

    const executeLocalhost = async (props: any) => {
        console.log("[Start Request]", props.endpoint)
        const myHeaders = new Headers();
        myHeaders.append("OData-MaxVersion", "4.0");
        myHeaders.append("OData-Version", "4.0");
        myHeaders.append("Content-Type", "application/json; charset=utf-8");
        myHeaders.append("Accept", "application/json");
        if(isLocalHost)
            myHeaders.append("Authorization", `Bearer ${apiRoutes.token}`);

        //const raw = JSON.stringify(props.parameters);

        const requestOptions = {
            method: props.method ?? "GET",
            headers: myHeaders,
            body: props?.body,
            redirect: "follow" as RequestRedirect
        };

        if (!requestOptions.body) {
            delete requestOptions.body;
        }

        const response = await fetch(`${apiRoutes.localhostUrl}${props.endpoint}`, requestOptions);
        return response;
    }

    return {
        updateRecord,
        getStatusMetadata,
        getBusinessProcessFlow,
        getOptionSets,
        getEntities,
        generateViewTypes,
        getViewsAndFields
    }
}
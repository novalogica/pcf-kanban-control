import { useMemo } from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { isNullOrEmpty, orderStages } from '../lib/utils';
import { ViewEntity } from '../interfaces';
import { XrmService } from './service';

export const useDataverse = (context: ComponentFramework.Context<IInputs>) => {
    const { parameters, webAPI } = context;
    const { dataset } = parameters;
    const entityName = useMemo(() => parameters.dataset.getTargetEntityType(), [])

    const xrmService = useMemo(() => {
        const service = XrmService.getInstance();
        service.setContext(context);
        return service;
    }, [context]);

    const updateRecord = async (record: any) => {
        return await webAPI.updateRecord(
            record.entityName,
            record.id,
            record.update
        )
    }

    const getStatusMetadata = async () => {
        try {
            const metadata = xrmService.fetch(`api/data/v9.2/EntityDefinitions(LogicalName='nl_opportunity')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName,DisplayName&$expand=OptionSet($select=Options,MetadataId)`)
            const options = (metadata as any).OptionSet?.Options;

            if (isNullOrEmpty(options))
                return;

            return options;
        } catch (e) {
            console.log(e)
        }
    }

    const getBusinessProcessFlows = async (logicalName: string, records: string[]) => {
        try {
            const stages = await webAPI.retrieveMultipleRecords(
                "processstage",
                `?$select=stagename,processstageid,stagecategory,_processid_value&$filter=primaryentitytypecode eq '${logicalName}'&$expand=processid($select=name,uniquename,statecode,uidata)`
            )

            const filter = context.parameters.filteredBusinessProcessFlows?.raw ?? "";
            const filterOutBusinessProcess = isNullOrEmpty(filter) ? undefined : JSON.parse(filter);

            const stagesReduced = stages.entities
                .filter((stage: any) => (!filterOutBusinessProcess || !filterOutBusinessProcess.includes(stage.processid.name)) && stage.processid.statecode == 1)
                .reduce((acc: any, stage: any) => {
                    let process = acc.find((p: any) => p.key === stage.processid.workflowid);
                    const processUiData = stage.processid.uidata ? JSON.parse(stage.processid.uidata) as BusinnessProcessFlowUIData : undefined;

                    let entities: BusinessProcessFlowEntity[] = [];

                    if (processUiData && processUiData.BusinessProcessFlowEntities && processUiData.BusinessProcessFlowEntities["$values"].length > 0) {
                        entities = processUiData.BusinessProcessFlowEntities["$values"]
                            .filter((entity: BusinessProcessFlowEntity) => !entity.Relationships);
                    }

                    const orderedEntities = orderStages(entities);

                    const column = {
                        id: stage.stagename,
                        key: stage.processstageid,
                        label: stage.stagename,
                        title: stage.stagename,
                        order: orderedEntities.findIndex(e => e.Stage.StageDisplayName === stage.stagename)
                    };

                    if (!process) {
                        process = {
                            key: stage.processid.workflowid,
                            text: stage.processid.name,
                            uniqueName: stage.processid.uniquename || undefined,
                            type: 'BPF',
                            columns: [column]
                        };
                        acc.push(process);
                    } else {
                        process.columns.push(column);
                    }

                    return acc;
                }, []);

            stagesReduced.forEach((process: any) => {
                const uniqueColumns = new Map();
                process.columns = process.columns.filter((column: any) => {
                    if (!uniqueColumns.has(column.id)) {
                        uniqueColumns.set(column.id, true);
                        return true;
                    }
                    return false;
                });
            });

            await Promise.all(stagesReduced.map(async (process: any) => {
                if (process != undefined) {
                    process.columns = process.columns.sort((a: any, b: any) => a.order - b.order)
                    process.records = await getRecordCurrentStage(logicalName, process.uniqueName, records)
                }
            }))

            return stagesReduced;
        } catch (e) {
            return [];
        }
    }

    const getRecordCurrentStage = async (entityName: string, logicalName: string | undefined, records: string[]): Promise<ComponentFramework.WebApi.Entity[]> => {
        if (!logicalName)
            return [];

        const process = logicalName.includes("_") ? `_bpf_${entityName}id_value` : `${entityName}id_value`;

        const property = logicalName.includes("_") ? `bpf_${entityName}id` : `${entityName}id`;
        const filter = `(Microsoft.Dynamics.CRM.In(PropertyName='${property}',PropertyValues=[${records.map(id => `'${id}'`).join(',')}]))`

        const stages = await webAPI.retrieveMultipleRecords(
            logicalName,
            `?$select=_activestageid_value,_processid_value,${process}&$filter=${filter}&$expand=activestageid($select=stagename)`
        );

        return stages.entities.map((item: any) => {
            return {
                id: item[process],
                stageName: item.activestageid.stagename
            }
        });
    }

    const retrieveStatusMetadata = async (logicalName: string): Promise<any> => {
        const entity = logicalName ?? entityName
        const options = await xrmService.fetch(`api/data/v9.2/EntityDefinitions(LogicalName='${entity}')/Attributes(LogicalName='statuscode')/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options,MetadataId)`);
        return (options as any).OptionSet?.Options;
    }

    const getOptionSets = async (activeView: ViewEntity | undefined) => {
        try {
            const datasetColumns = dataset.columns.filter(col => col.dataType == "OptionSet");
            const entityLogicalName = activeView?.entity ?? entityName

            if (isNullOrEmpty(datasetColumns) || datasetColumns.length <= 0) {
                return [];
            }

            const filter = datasetColumns.map((column) => `attributename eq '${column.name}'`).join(' or ');

            const columnOptions = await webAPI.retrieveMultipleRecords(
                "stringmap",
                `?$filter=(objecttypecode eq '${entityLogicalName}' and (${filter}))`
            );

            const columns = datasetColumns.map((column) => {
                const options = columnOptions.entities
                    .filter((option: any) => option.attributename == column.name)
                    .filter((option: any) => option.langid == context.userSettings.languageId)
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
                    columns: [
                        ...options
                    ]
                }
            })

            const statusCodeColumn = columns.find((item) => item.key == 'statuscode');

            if (statusCodeColumn) {
                const statusCodeOptions = await retrieveStatusMetadata(activeView?.entity as string);
                const filteredStatusCodeOptions = statusCodeOptions.filter((option: any) => option.State == 0);

                statusCodeColumn.columns = statusCodeColumn.columns.filter((columnOption: any) =>
                    filteredStatusCodeOptions.some((filteredOption: any) => filteredOption.Value === columnOption.key)
                );
            }

            const sortedColumns = columns.map(item => ({
                ...item,
                columns: item.columns.sort((a: any, b: any) => a.order - b.order)
            }));

            return sortedColumns;
        } catch (e) {
            console.log(e)
        }
    }

    return {
        updateRecord,
        getStatusMetadata,
        getBusinessProcessFlows,
        getOptionSets,
        getRecordCurrentStage
    }
}
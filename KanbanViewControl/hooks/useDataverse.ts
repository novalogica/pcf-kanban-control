import { useMemo, useRef } from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { isNullOrEmpty, orderStages, chunkArray } from '../lib/utils';
import { ViewEntity } from '../interfaces';
import { XrmService } from './service';

export type ConfigErrorReporter = (property: string, message: string) => void;
export type ClearConfigError = (property: string) => void;

/**
 * Anzahl Record-IDs pro In()-Filter bei der BPF-Stage-Abfrage. Alle IDs (bis 2500) in
 * einer URL wuerden die URL-Laengenlimits sprengen; daher wird in Chunks abgefragt.
 */
const BPF_STAGE_QUERY_CHUNK_SIZE = 100;

export const useDataverse = (context: ComponentFramework.Context<IInputs>, onConfigError?: ConfigErrorReporter, clearConfigError?: ClearConfigError) => {
    const { parameters, webAPI } = context;
    const { dataset } = parameters;
    const entityName = useMemo(() => parameters.dataset.getTargetEntityType(), [])

    // Cache fuer die STATISCHEN OptionSet-/stringmap-/statuscode-Metadaten. Diese aendern
    // sich waehrend einer Session praktisch nie, wurden aber bisher bei jedem
    // handleColumnsChange (jede dataset.columns-Referenzaenderung, u.a. nach jedem
    // dataset.refresh()) neu vom Server geholt. Gekeyed auf Entity + Sprache + Spalten.
    // (BPF-Stages pro Record bleiben bewusst ungecacht - siehe getRecordCurrentStage.)
    const optionSetsCacheRef = useRef<{ key: string; value: any } | null>(null);

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

    const getBusinessProcessFlows = async (logicalName: string, records: string[]) => {
        try {
            const stages = await webAPI.retrieveMultipleRecords(
                "processstage",
                `?$select=stagename,processstageid,stagecategory,_processid_value&$filter=primaryentitytypecode eq '${logicalName}'&$expand=processid($select=name,uniquename,statecode,uidata)`
            )

            const filter = context.parameters.filteredBusinessProcessFlows?.raw ?? "";
            let filterOutBusinessProcess: string[] | undefined;
            if (!isNullOrEmpty(filter)) {
                try {
                    filterOutBusinessProcess = JSON.parse(filter);
                    clearConfigError?.("filteredBusinessProcessFlows");
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    onConfigError?.("filteredBusinessProcessFlows", msg);
                }
            }

            const stepOrderConfigRaw = context.parameters.businessProcessFlowStepOrder?.raw ?? "";
            let stepOrderConfig: { id: string; order: number }[] | undefined;

            if (!isNullOrEmpty(stepOrderConfigRaw)) {
                try {
                    stepOrderConfig = JSON.parse(stepOrderConfigRaw);
                    clearConfigError?.("businessProcessFlowStepOrder");
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    onConfigError?.("businessProcessFlowStepOrder", msg);
                }
            }

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

                    const defaultOrder = orderedEntities.findIndex(e => e.Stage.StageDisplayName === stage.stagename);
                    const customOrder = stepOrderConfig?.find(config => config.id === stage.stagename)?.order;

                    const column = {
                        id: stage.stagename,
                        key: stage.processstageid,
                        label: stage.stagename,
                        title: stage.stagename,
                        order: customOrder ?? defaultOrder
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

        // In Chunks abfragen, damit die In()-Filter-URL bei vielen Records nicht zu lang wird.
        const chunks = chunkArray(records, BPF_STAGE_QUERY_CHUNK_SIZE);
        const perChunk = await Promise.all(
            chunks.map(async (chunk) => {
                const filter = `(Microsoft.Dynamics.CRM.In(PropertyName='${property}',PropertyValues=[${chunk.map(id => `'${id}'`).join(',')}]))`
                const stages = await webAPI.retrieveMultipleRecords(
                    logicalName,
                    `?$select=_activestageid_value,_processid_value,${process}&$filter=${filter}&$expand=activestageid($select=stagename)`
                );
                return stages.entities.map((item: any) => ({
                    id: item[process],
                    stageName: item.activestageid.stagename
                }));
            })
        );

        return perChunk.flat();
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

            const cacheKey = `${entityLogicalName}|${context.userSettings.languageId}|${datasetColumns.map((c) => c.name).sort().join(',')}`;
            if (optionSetsCacheRef.current && optionSetsCacheRef.current.key === cacheKey) {
                return optionSetsCacheRef.current.value;
            }

            const filter = datasetColumns.map((column) => `attributename eq '${column.name}'`).join(' or ');

            const columnOptions = await webAPI.retrieveMultipleRecords(
                "stringmap",
                `?$filter=(objecttypecode eq '${entityLogicalName}' and (${filter}))`
            );

            const userLang = context.userSettings.languageId;

            const columns = datasetColumns.map((column) => {
                const columnEntries = columnOptions.entities.filter(
                    (option: any) => option.attributename == column.name
                );

                // Pro Options-Wert (attributevalue) das Label in der Benutzersprache
                // bevorzugen. Fehlt die Übersetzung, auf einen anderen gepflegten
                // Sprach-Eintrag zurückfallen, damit die Spalte trotzdem existiert
                // (sonst würden Karten dieses Werts ganz verschwinden).
                const optionByValue = new Map<string, any>();
                for (const opt of columnEntries) {
                    const value = String(opt.attributevalue);
                    const current = optionByValue.get(value);
                    if (current == null) {
                        optionByValue.set(value, opt);
                    } else if (opt.langid == userLang && current.langid != userLang) {
                        optionByValue.set(value, opt);
                    }
                }

                const options = Array.from(optionByValue.values()).map((option: any) => ({
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

            optionSetsCacheRef.current = { key: cacheKey, value: sortedColumns };
            return sortedColumns;
        } catch (e) {
            console.log(e)
        }
    }

    return {
        updateRecord,
        getBusinessProcessFlows,
        getOptionSets,
        getRecordCurrentStage
    }
}
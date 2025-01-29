export type FieldMetadata = {
    type: string;
    displayName: string;
};

type FieldObject = {
    name: string;
    displayName: string;
    dataType: string;
    alias: string;
    order: number;
};

export type ViewEntity = {
    key: string | number;
    savedqueryid?: string;
    userqueryid?: string;
    name: string;
    text: string;
    layoutxml: string;
    fields: FieldObject[];
    records: any[];
    entity: string;
};
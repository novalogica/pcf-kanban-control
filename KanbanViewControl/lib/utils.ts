/* eslint-disable @typescript-eslint/no-explicit-any */
import { PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { ToastOptions } from "react-hot-toast";
import { CardInfo, CardItem, UniqueIdentifier } from "../interfaces";

export const isNullOrEmpty = (value: unknown) => {
    if(value === '' || value == null || !value)
        return true;
    
    return false;
}

export const getColumnValue = (
    record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, 
    column: ComponentFramework.PropertyHelper.DataSetApi.Column
): string | CardInfo => {
    const value = record.getValue(column.name);

    if (value === null || value === undefined) {
        return { label: column.displayName, value: "" };
    }

    if (isEntityReference(value) || isLookupValue(value)) {
        return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.EntityReference }
    }

    if (Array.isArray(value) && value.length > 0) {
        if (isEntityReference(value[0])) {
            return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.EntityReference[] };
        }

        if (isLookupValue(value[0])) {
            return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.LookupValue[] };
        }
    }

    return { label: column.displayName, value: record.getFormattedValue(column.name) };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEntityReference = (value: any): value is ComponentFramework.EntityReference => {
    return value && typeof value === 'object' && 'id' in value && 'etn' in value && 'name' in value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLookupValue = (value: any): value is ComponentFramework.LookupValue => {
    return value && typeof value === 'object' && 'id' in value && 'name' in value && 'entityType' in value;
}

export const getRandomInt = (min: number , max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getColorFromInitials = (initials: string, colorPalette: PersonaInitialsColor[]) => {
    const charSum = initials
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return colorPalette[charSum % colorPalette.length];
}

export const toastOptions: ToastOptions = {
    style: {
        borderRadius: 2,
        padding: 16
    },
    duration: 5000
}

export const validateSumProperty = (cards: CardItem[], sumField: string): boolean => {
    return cards?.some(card => 
        Object.prototype.hasOwnProperty.call(card, sumField) 
        && typeof (card[sumField] as CardInfo).value === 'number');
}

export const isLocalHost = (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);

export const apiRoutes = {
    localhostUrl: `https://kickstartcrm.crm4.dynamics.com/api/data/v9.2/`,
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCIsImtpZCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCJ9.eyJhdWQiOiJodHRwczovL2tpY2tzdGFydGNybS5jcm00LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4Zi8iLCJpYXQiOjE3MzMzMjM4ODUsIm5iZiI6MTczMzMyMzg4NSwiZXhwIjoxNzMzMzI4NTg3LCJhY2N0IjowLCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOFlBQUFBOG54bEU4azhLOGxuN29RQzg2dDV1Z3J0anBQVEVjMmc2OWMySU93d3FLTWw0dm05bVlUM094OUdxd2w1aDB5eSIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiI1MWY4MTQ4OS0xMmVlLTRhOWUtYWFhZS1hMjU5MWY0NTk4N2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbW9zIiwiZ2l2ZW5fbmFtZSI6IlRpYWdvIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiMjAwMTo4MTg6ZWEzNDpmYjAwOmYxN2E6MTQxODo4YjBlOjJkYWQiLCJsb2dpbl9oaW50IjoiTy5DaVExTXpOaE56QTNZUzAzWXpWaUxUUXpNbVl0T1RBeFlTMWxNV1l3WVRKbVpqZGtPV1lTSkRFME9UUTBZVEV3TFdNMU1tRXROR1EzTWkwNE5EY3lMVEU0TWpNMFlqWm1OekU0WmhvVGRHbGhaMjlBYm05MllXeHZaMmxqWVM1d2RDREVBUT09IiwibmFtZSI6IlRpYWdvIFJhbW9zIiwib2lkIjoiNTMzYTcwN2EtN2M1Yi00MzJmLTkwMWEtZTFmMGEyZmY3ZDlmIiwicHVpZCI6IjEwMDMyMDAxRjU0NDc2MTEiLCJyaCI6IjEuQVYwQUVFcVVGQ3JGY2syRWNoZ2pTMjl4andjQUFBQUFBQUFBd0FBQUFBQUFBQUFLQVRaZEFBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Ik95cWZfMllqUXB4T2VtdGVtWHhGNEI0UXFwQ29kaVgwZGM4WEx3R2lKcjgiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiIxNDk0NGExMC1jNTJhLTRkNzItODQ3Mi0xODIzNGI2ZjcxOGYiLCJ1bmlxdWVfbmFtZSI6InRpYWdvQG5vdmFsb2dpY2EucHQiLCJ1cG4iOiJ0aWFnb0Bub3ZhbG9naWNhLnB0IiwidXRpIjoiUWhKOWNqanVNRVNaZTRnTEMtSURBQSIsInZlciI6IjEuMCIsInhtc19pZHJlbCI6IjEgNiJ9.k-oqzOAJ3T8AxJScsSTuI2rc-maezbBKht9rLYYxhjyiXLzJS6k4UgkoQYDg7-4qoKMq2fCeNzfFlSTdDeLFnQlFdDpQim4khQDR8LakLedNzuqCWuWNya59onDa_WRfuy4XoR1EdI6d_or2Z1s7B0bk2BUssBa3Fir2PEjIPowMs2YQ5oD3Ai8SO40KN6vaVwkJUQYjyjtgG_O4IG-IHG5Z3saERM8r6Q6aWW1rOp3AMjI_Gr7j0UvbsqVk7J9qnKIwjI2Dv1C0uXswQK8zfr8zkqOSL3EWmrU3MtDUjPiqPtNxKcFEb5mE3ipKoIAUNsHRQzHaBf5VCih7n3nMBw`
}

/**
 * Custom logging function with support for conditional logging outside localhost.
 * 
 * @param message - The primary log message.
 * @param optionalParams - Additional parameters to log.
 */
export const consoleLog = (message?: any, ...optionalParams: any[]) => {
    // Check if anyWhereDebug is in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const isAnyWhereDebugInURL = urlParams.has('anyWhereDebug');

    // Log only on localhost or if `anyWhereDebug` is in optionalParams or URL
    const shouldLog = 
        isLocalHost || 
        optionalParams.some(param => param?.anyWhereDebug) || 
        isAnyWhereDebugInURL;

    if (shouldLog) {
        // Filter out `anyWhereDebug` options from the optional parameters
        const filteredParams = optionalParams.filter(param => !param?.anyWhereDebug);
        console.log(message, ...filteredParams);
    }
};


export const PluralizedName = (logicalName: string) => {
    if (!logicalName) return '';

    if (logicalName.endsWith('y')) {
        return logicalName.slice(0, -1) + 'ies';
    } else if (logicalName.endsWith('s')) {
        return logicalName + 'es';
    } else {
        return logicalName + 's';
    }
}
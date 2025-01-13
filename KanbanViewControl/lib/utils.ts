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

export const unlocatedColumn = {
    key: "unallocated",
    id: "unallocated", 
    label: "Unallocated",
    title: "Unallocated", 
    order: 0
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
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InoxcnNZSEhKOS04bWdndDRIc1p1OEJLa0JQdyIsImtpZCI6InoxcnNZSEhKOS04bWdndDRIc1p1OEJLa0JQdyJ9.eyJhdWQiOiJodHRwczovL2tpY2tzdGFydGNybS5jcm00LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4Zi8iLCJpYXQiOjE3MzY3Mjk5OTMsIm5iZiI6MTczNjcyOTk5MywiZXhwIjoxNzM2NzM0NDA5LCJhY2N0IjowLCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOFpBQUFBUlU4alJzZ1hLdlFpTTh0N2ErSkJucTZvODVVL2FUVGpYdGZEekxVVWRKVCtlL3RxR1BqdXpBSmI2dHVzNldhZSIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiI1MWY4MTQ4OS0xMmVlLTRhOWUtYWFhZS1hMjU5MWY0NTk4N2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbW9zIiwiZ2l2ZW5fbmFtZSI6IlRpYWdvIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiMjAwMTo4MTg6ZWEzNDpmYjAwOmQ1NmY6NTIxZjo4YTFlOmQzNjMiLCJsb2dpbl9oaW50IjoiTy5DaVExTXpOaE56QTNZUzAzWXpWaUxUUXpNbVl0T1RBeFlTMWxNV1l3WVRKbVpqZGtPV1lTSkRFME9UUTBZVEV3TFdNMU1tRXROR1EzTWkwNE5EY3lMVEU0TWpNMFlqWm1OekU0WmhvVGRHbGhaMjlBYm05MllXeHZaMmxqWVM1d2RDRDVBUT09IiwibmFtZSI6IlRpYWdvIFJhbW9zIiwib2lkIjoiNTMzYTcwN2EtN2M1Yi00MzJmLTkwMWEtZTFmMGEyZmY3ZDlmIiwicHVpZCI6IjEwMDMyMDAxRjU0NDc2MTEiLCJyaCI6IjEuQVYwQUVFcVVGQ3JGY2syRWNoZ2pTMjl4andjQUFBQUFBQUFBd0FBQUFBQUFBQUFLQVRaZEFBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInNpZCI6IjAwMTE0NWY5LTQzNTEtMmY5Yy0yNDk2LTlhZTc3YzQ4OTJkMiIsInN1YiI6Ik95cWZfMllqUXB4T2VtdGVtWHhGNEI0UXFwQ29kaVgwZGM4WEx3R2lKcjgiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiIxNDk0NGExMC1jNTJhLTRkNzItODQ3Mi0xODIzNGI2ZjcxOGYiLCJ1bmlxdWVfbmFtZSI6InRpYWdvQG5vdmFsb2dpY2EucHQiLCJ1cG4iOiJ0aWFnb0Bub3ZhbG9naWNhLnB0IiwidXRpIjoidTlNcjJlUk9sVUdRSkRTREVuRk1BQSIsInZlciI6IjEuMCIsInhtc19pZHJlbCI6IjEgMiJ9.bj4b5dMZOaOYvTzH3WsWyzedrdWToY5-QvIwqqV_bzfAnBtOqLwHQqsVg_7NzB4Ytg2OyVIIVJbiOQvo2YmOFMWXHj04bgvTmqr1OfMHW_1GqBjgxNkfyoAA2rOQuQpLRFzCq9bulA1gYkJwyC4eJenJxjTmn24KW6Ar-_L8Gn726u44gti6qfza1q-X1oAsiucszxrW_ekBzmwCs6enYEA8yGuWA8dESVdkLuio3oIeE36bJNurR_tIqgxxjsWLxy2_R0nOOg88YAsE1LlUVJQPLNernG9YwCTu4tG08eIQ8vNW9oBDEL660JvBcQrH2eE34o0YqN1kIForbX4pfg`
}

const debugAnyWhere = false;

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
        debugAnyWhere ||
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
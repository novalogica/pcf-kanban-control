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
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCIsImtpZCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCJ9.eyJhdWQiOiJodHRwczovL2tpY2tzdGFydGNybS5jcm00LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4Zi8iLCJpYXQiOjE3MzM5MjM1NzQsIm5iZiI6MTczMzkyMzU3NCwiZXhwIjoxNzMzOTI4NjUxLCJhY2N0IjowLCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOFlBQUFBMDBpdGM0MzVNYlNMZzVPaTltakt2THQ1M3dTZ2p6NFpXUFVaRXhEQzc2OFl6QXF6MU02SnZmbUNaUWFicm1VSyIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiI1MWY4MTQ4OS0xMmVlLTRhOWUtYWFhZS1hMjU5MWY0NTk4N2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbW9zIiwiZ2l2ZW5fbmFtZSI6IlRpYWdvIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiMjAwMTo4MTg6ZWEzNDpmYjAwOjM1OWE6ODU5MzoyNjA3OjEwN2UiLCJsb2dpbl9oaW50IjoiTy5DaVExTXpOaE56QTNZUzAzWXpWaUxUUXpNbVl0T1RBeFlTMWxNV1l3WVRKbVpqZGtPV1lTSkRFME9UUTBZVEV3TFdNMU1tRXROR1EzTWkwNE5EY3lMVEU0TWpNMFlqWm1OekU0WmhvVGRHbGhaMjlBYm05MllXeHZaMmxqWVM1d2RDQlAiLCJuYW1lIjoiVGlhZ28gUmFtb3MiLCJvaWQiOiI1MzNhNzA3YS03YzViLTQzMmYtOTAxYS1lMWYwYTJmZjdkOWYiLCJwdWlkIjoiMTAwMzIwMDFGNTQ0NzYxMSIsInJoIjoiMS5BVjBBRUVxVUZDckZjazJFY2hnalMyOXhqd2NBQUFBQUFBQUF3QUFBQUFBQUFBQUtBVFpkQUEuIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiT3lxZl8yWWpRcHhPZW10ZW1YeEY0QjRRcXBDb2RpWDBkYzhYTHdHaUpyOCIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJFVSIsInRpZCI6IjE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4ZiIsInVuaXF1ZV9uYW1lIjoidGlhZ29Abm92YWxvZ2ljYS5wdCIsInVwbiI6InRpYWdvQG5vdmFsb2dpY2EucHQiLCJ1dGkiOiJPTkF6REhKNUIwU2ZOS0VhVlcxTEFBIiwidmVyIjoiMS4wIiwieG1zX2lkcmVsIjoiMSAyIn0.KjZMgpSUEGODZKZBzIeq2pTLzbZ0FqR4_ofYaFv0tqJbRenJ4iYx39fJ7QdSgXbge5ik_RZU0VTsJQJ7A5pVL_3u0bRpMqm_61i3hcu8Bd2Y-3Ytaot1auawWz2nqtCeO0wRkd2mrX919FPGqgc5K5M6xYUiExXekNz7ZVB0-W9qN4k4LsVmkoJD5v4MJS8xaOooLnuL2Rk8icLMkZqN8V7nGALrPfj7JTxha8G03IAxzH_s_eSHGYfQm_1YAv9WrbImxtjnau9pu3EqiKFMoZOOH7DQDslxOrS4ipFFiWwfowx1W3kogJZpH0D8sKxGgXy_HUznRt_zkgbyrEBWlw`
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
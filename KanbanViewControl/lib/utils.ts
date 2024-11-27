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
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCIsImtpZCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCJ9.eyJhdWQiOiJodHRwczovL2tpY2tzdGFydGNybS5jcm00LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4Zi8iLCJpYXQiOjE3MzI3MjA4ODIsIm5iZiI6MTczMjcyMDg4MiwiZXhwIjoxNzMyNzI2NDQ5LCJhY2N0IjowLCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOFlBQUFBVHRIcXVSN1I3R2lVeHpMZWMwdGdZcWtuWG93eXAyS3R1NmZBM3pMVG4wTGVHTFY2azJrNXRxWVh2T1VwTE45ayIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiI1MWY4MTQ4OS0xMmVlLTRhOWUtYWFhZS1hMjU5MWY0NTk4N2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbW9zIiwiZ2l2ZW5fbmFtZSI6IlRpYWdvIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiMjAwMTo4MTg6ZWEzNDpmYjAwOjhkZDI6ZTA1ODo3MzY3OmI4NzQiLCJsb2dpbl9oaW50IjoiTy5DaVExTXpOaE56QTNZUzAzWXpWaUxUUXpNbVl0T1RBeFlTMWxNV1l3WVRKbVpqZGtPV1lTSkRFME9UUTBZVEV3TFdNMU1tRXROR1EzTWkwNE5EY3lMVEU0TWpNMFlqWm1OekU0WmhvVGRHbGhaMjlBYm05MllXeHZaMmxqWVM1d2RDQlYiLCJuYW1lIjoiVGlhZ28gUmFtb3MiLCJvaWQiOiI1MzNhNzA3YS03YzViLTQzMmYtOTAxYS1lMWYwYTJmZjdkOWYiLCJwdWlkIjoiMTAwMzIwMDFGNTQ0NzYxMSIsInJoIjoiMS5BVjBBRUVxVUZDckZjazJFY2hnalMyOXhqd2NBQUFBQUFBQUF3QUFBQUFBQUFBQUtBVFpkQUEuIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiT3lxZl8yWWpRcHhPZW10ZW1YeEY0QjRRcXBDb2RpWDBkYzhYTHdHaUpyOCIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJFVSIsInRpZCI6IjE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4ZiIsInVuaXF1ZV9uYW1lIjoidGlhZ29Abm92YWxvZ2ljYS5wdCIsInVwbiI6InRpYWdvQG5vdmFsb2dpY2EucHQiLCJ1dGkiOiJFOEN1b2J3T3MwT1RNWG1qU1BwYUFBIiwidmVyIjoiMS4wIiwieG1zX2lkcmVsIjoiMSAyMiJ9.S9zDABm6VjxVA_nauI92isxXOCCLe065QnA4zXqy8DEcD3ZHa0qpFoSTu9NDsqak-Hj7cXNek8VtaCUA7koeHvSAMaXV0aIzhPvCSB5o-QvgYRis0r4BxGE4z4ByJ5b3hLTIQN4XEaWOhOKsMy3GzhKNarbhTTblqk80Cne6HwFNJUFyLIJHRdEECLtsGxVJDiHkLlB5Ccy30bddB8KCytr905nK869MOMqHh6WBnROuXpa0rr6tk6cdDNGA0wGzvxfcqYFiGEqR0ybBzzXgJKxQ9mC8f5Da4cwZn7C9U8Q1SNtEVqTRosEPaYALdwYRIbhKhkU7qUwuNZ39WE3Owg`
}

/**
 * Custom logging function with support for conditional logging outside localhost.
 * 
 * @param message - The primary log message.
 * @param optionalParams - Additional parameters to log.
 * @param options - Additional options, e.g., `anyWhereDebug` to force logs everywhere.
 */
export const consoleLog = (message?: any, ...optionalParams: any[]) => {
    // Log only on localhost unless `anyWhereDebug` is explicitly set
    const shouldLog = isLocalHost || optionalParams.some(param => param?.anyWhereDebug);
    
    if (shouldLog) {
        // Filter out `anyWhereDebug` options from the optional parameters
        const filteredParams = optionalParams.filter(param => !param?.anyWhereDebug);
        console.log(message, ...filteredParams);
    }
}
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
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCIsImtpZCI6Inp4ZWcyV09OcFRrd041R21lWWN1VGR0QzZKMCJ9.eyJhdWQiOiJodHRwczovL2tpY2tzdGFydGNybS5jcm00LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzE0OTQ0YTEwLWM1MmEtNGQ3Mi04NDcyLTE4MjM0YjZmNzE4Zi8iLCJpYXQiOjE3MzIyODk0NzYsIm5iZiI6MTczMjI4OTQ3NiwiZXhwIjoxNzMyMjk1MTUzLCJhY2N0IjowLCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOFlBQUFBL2t4ZlN0ejZOS0dHQXJxaDZOc0QwdWxNVjNVVmNPN0NEdkhZdUU1eFlteWllTVNNbGhTSG1iVDhLcG5UWWcvWSIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiI1MWY4MTQ4OS0xMmVlLTRhOWUtYWFhZS1hMjU5MWY0NTk4N2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbW9zIiwiZ2l2ZW5fbmFtZSI6IlRpYWdvIiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiMjAwMTo4MTg6ZWEzNDpmYjAwOjM1Mzk6ODA6MTNkYzphNzJmIiwibG9naW5faGludCI6Ik8uQ2lRMU16TmhOekEzWVMwM1l6VmlMVFF6TW1ZdE9UQXhZUzFsTVdZd1lUSm1aamRrT1dZU0pERTBPVFEwWVRFd0xXTTFNbUV0TkdRM01pMDRORGN5TFRFNE1qTTBZalptTnpFNFpob1RkR2xoWjI5QWJtOTJZV3h2WjJsallTNXdkQ0JFIiwibmFtZSI6IlRpYWdvIFJhbW9zIiwib2lkIjoiNTMzYTcwN2EtN2M1Yi00MzJmLTkwMWEtZTFmMGEyZmY3ZDlmIiwicHVpZCI6IjEwMDMyMDAxRjU0NDc2MTEiLCJyaCI6IjEuQVYwQUVFcVVGQ3JGY2syRWNoZ2pTMjl4andjQUFBQUFBQUFBd0FBQUFBQUFBQUFLQVRaZEFBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Ik95cWZfMllqUXB4T2VtdGVtWHhGNEI0UXFwQ29kaVgwZGM4WEx3R2lKcjgiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiRVUiLCJ0aWQiOiIxNDk0NGExMC1jNTJhLTRkNzItODQ3Mi0xODIzNGI2ZjcxOGYiLCJ1bmlxdWVfbmFtZSI6InRpYWdvQG5vdmFsb2dpY2EucHQiLCJ1cG4iOiJ0aWFnb0Bub3ZhbG9naWNhLnB0IiwidXRpIjoiOW5BYzdWYTJBMGlTWTF2eFllWXdBQSIsInZlciI6IjEuMCIsInhtc19pZHJlbCI6IjEgMjAifQ.aLF0P2eVAAaekcfHghbGTyCheQx4t6PYWEHlQxgbvXEsORhqY3mZS4fvPakv-FXA7OLW0zbsmWRRn9wDTbLRYxFjbnG6Y_BK2FKVROR2xi2KktdhDqfSPEvbpgMztli1sWhfX5y_a9mTtw9ZdyLTg2Lls3q8PSYy8QQoFSXM7nv0JFB5L6tRttm0Fe4mTuywnrvrzQ1QoxFOSTmVBw5TvR9batijRlFNvi1qv34SQ1woJCtuagXta0wQSgFNGf-pgUI8LrEczEhjCjbdCSnl4iCU7OzvlPpMgRzs0-bkJUQEJ3xdSIfiDJ-Kx53nrNuV77T9Bv4c22aIAf5aKan_hg`
}

export const DebugOn = (
    isLocalHost ?? false
)
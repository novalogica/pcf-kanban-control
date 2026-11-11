import { useCallback, useMemo } from "react";
import { IInputs } from "../generated/ManifestTypes";
import { isNullOrEmpty } from "../lib/utils";

const popupOtions = {
    height: {value: 85, unit:"%"},
    width: {value: 90, unit:"%"}, 
    target: 2,  
    position: 1
}

function getClientUrl(): string {
    const w = typeof window !== "undefined" ? window : undefined;
    const xrm = (w as { Xrm?: { Utility?: { getGlobalContext?: () => { getClientUrl?: () => string } } } })?.Xrm;
    const url = xrm?.Utility?.getGlobalContext?.()?.getClientUrl?.();
    if (url) return url.replace(/\/$/, "");
    if (w?.location?.origin) return w.location.origin;
    return "";
}

/**
 * Holt die Basis-URL der Parent-Location (wie Modern-Dropzone-PCF).
 * @see https://github.com/GorgonUK/Modern-Dropzone-PCF/blob/main/Dropzone/DataverseActions.tsx
 */
async function fetchSiteUrl(
    clientUrl: string,
    parentLocationId: string,
    entityName: string,
    recordId: string
): Promise<string> {
    const url = `${clientUrl.replace(/\/$/, "")}/api/data/v9.0/FetchSiteUrl`;
    const body = JSON.stringify({
        DocumentId: parentLocationId,
        ParentEntityReference: {
            "@odata.type": `Microsoft.Dynamics.CRM.${entityName}`,
            [`${entityName}id`]: recordId,
        },
    });
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
    });
    if (!res.ok) throw new Error(`FetchSiteUrl failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const siteUrl = data?.SiteAndLocationUrl;
    if (!siteUrl) throw new Error("SiteAndLocationUrl not found in FetchSiteUrl response");
    return siteUrl;
}

/**
 * Erstellt eine SharePoint-Location (und physischen Ordner) per AddOrEditLocation (wie Dynamics-UI).
 * @see https://github.com/GorgonUK/Modern-Dropzone-PCF/blob/main/Dropzone/DataverseActions.tsx
 */
async function addOrEditLocation(
    clientUrl: string,
    parentLocationId: string,
    entityName: string,
    recordId: string,
    locationName: string
): Promise<string> {
    const siteUrl = await fetchSiteUrl(clientUrl, parentLocationId, entityName, recordId);
    const absUrl = siteUrl.replace(/\/$/, "") + "/" + locationName;
    const url = `${clientUrl.replace(/\/$/, "")}/api/data/v9.0/AddOrEditLocation`;
    const body = JSON.stringify({
        AbsUrl: absUrl,
        DocumentId: "",
        IsAddOrEditMode: true,
        IsCreateFolder: true,
        LocationName: locationName,
        ParentEntityReference: {
            "@odata.type": `Microsoft.Dynamics.CRM.${entityName}`,
            [`${entityName}id`]: recordId,
        },
        ParentId: parentLocationId,
        ParentType: "sharepointdocumentlocation",
        RelativePath: locationName,
    });
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "OData-Version": "4.0",
            "OData-MaxVersion": "4.0",
            Accept: "application/json",
        },
        body,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AddOrEditLocation failed: ${res.status} ${res.statusText} ${text}`);
    }
    const data = await res.json();
    const locationId = data?.LocationId;
    if (!locationId) throw new Error("LocationId not found in AddOrEditLocation response");
    return locationId;
}

/**
 * Versucht, den SharePoint-Ordner per REST anzulegen (nur bei createRecord-Fallback).
 * Von Dynamics-Origin zu SharePoint wird der Aufruf per CORS blockiert – das ist erwartbar.
 * Nach AddOrEditLocation wird diese Funktion nicht aufgerufen (Ordner ist bereits serverseitig angelegt).
 */
async function ensureSharePointFolderExists(absoluteUrl: string): Promise<void> {
    if (typeof fetch === "undefined") return;
    try {
        const url = new URL(absoluteUrl);
        const pathname = url.pathname;
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length < 2) return;
        const siteRelativePath = "/" + segments.slice(0, 2).join("/");
        const siteRoot = url.origin + siteRelativePath;
        const apiUrl = siteRoot + "/_api/web/folders";

        for (let i = 2; i <= segments.length; i++) {
            const relativePath = "/" + segments.slice(0, i).join("/");
            const res = await fetch(apiUrl, {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    ODataVersion: "4.0",
                },
                body: JSON.stringify({
                    __metadata: { type: "SP.Folder" },
                    ServerRelativeUrl: relativePath,
                }),
            });
            if (!res.ok && res.status !== 409) {
                const text = await res.text();
                console.warn("[Kanban SharePoint] Folder ensure failed", res.status, relativePath, text);
                break;
            }
        }
    } catch (e) {
        console.warn("[Kanban SharePoint] ensureSharePointFolderExists", e);
    }
}

export const useNavigation = (context: ComponentFramework.Context<IInputs>) => {
    const { dataset } = context.parameters;

    const openForm = useCallback(async (entityName: string, id?: string): Promise<void> => {
        const pageInput = {
            entityName: entityName,
            entityId: id,
            pageType: "entityrecord"
        }

        //@ts-expect-error - Method does not exist in PCF SDK however it should be use to maintain control state alive
        await context.navigation.navigateTo(pageInput, popupOtions);
    }, [context]);

    /** Opens the entity record in a new browser tab (_blank). */
    const openEntityInNewTab = useCallback((entityName: string, id: string): void => {
        const baseUrl = getClientUrl();
        if (!baseUrl || !id) return;
        const url = `${baseUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(entityName)}&id=${encodeURIComponent(id)}`;
        if (typeof window !== "undefined" && window.open) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            context.navigation.openUrl(url);
        }
    }, [context]);

    const createNewRecord = useCallback(async (field?: string, column?: string): Promise<void> => {
        const pageInput = {
            entityName: dataset.getTargetEntityType(),
            pageType: "entityrecord",
            data : {}
        }

        if(!isNullOrEmpty(field) && !isNullOrEmpty(column)) {
            pageInput.data = { [field as string]: column }
        }

        //@ts-expect-error - Method does not exist in PCF SDK however it should be use to maintain control state alive
        await context.navigation.navigateTo(pageInput, popupOtions);
    }, [context, dataset]);

    /** Opens quick create form (or create form) for an activity entity with the given record as "regarding" (createFromEntity). */
    const openCreateActivityForm = useCallback(async (
        activityEntityName: string,
        parentEntityName: string,
        parentId: string,
        parentName?: string
    ): Promise<void> => {
        const nav = context.navigation as {
            openForm?: (
                options: {
                    entityName: string;
                    useQuickCreateForm?: boolean;
                    createFromEntity?: { entityType: string; id: string; name?: string };
                },
                formParameters?: Record<string, string>
            ) => Promise<unknown>;
        };
        if (typeof nav.openForm !== "function") {
            return;
        }
        const options: {
            entityName: string;
            useQuickCreateForm: boolean;
            createFromEntity: { entityType: string; id: string; name?: string };
        } = {
            entityName: activityEntityName,
            useQuickCreateForm: true,
            createFromEntity: {
                entityType: parentEntityName,
                id: parentId,
                ...(parentName != null && parentName !== "" ? { name: parentName } : {}),
            },
        };
        await nav.openForm(options, {});
    }, [context]);

    /**
     * Returns the Web API entity set name for a given entity logical name (for @odata.bind).
     * Standard entities use known plurals; custom entities fallback to logicalname + "s".
     */
    function getEntitySetName(logicalName: string): string {
        const map: Record<string, string> = {
            account: "accounts",
            contact: "contacts",
            opportunity: "opportunities",
            lead: "leads",
            incident: "incidents",
            systemuser: "systemusers",
            task: "tasks",
            appointment: "appointments",
            email: "emails",
        };
        return map[logicalName.toLowerCase()] ?? logicalName + "s";
    }

    /**
     * Bereinigt einen Namen für relativeurl (SharePoint/Dataverse).
     * Ungültige Zeichen: ~ " # % & * : < > ? / \ { | }
     * Darf nicht mit . enden, keine aufeinanderfolgenden Punkte, nicht .aspx/.ashx/.asmx/.svc am Ende.
     */
    function sanitizeRelativeUrlName(name: string): string {
        let s = name
            .replace(/[~"#%&*:<>?/\\{|}]/g, "-")
            .replace(/\.{2,}/g, "-")
            .replace(/-+/g, "-")
            .replace(/^[.-]+|[.-]+$/g, "")
            .trim();
        const invalidSuffixes = [".aspx", ".ashx", ".asmx", ".svc"];
        for (const suffix of invalidSuffixes) {
            if (s.toLowerCase().endsWith(suffix)) s = s.slice(0, -suffix.length).replace(/-+$/, "");
        }
        return s.length > 0 ? s : "Folder";
    }

    /**
     * Holt den offiziellen Anzeigenamen des Datensatzes (Primary-Name-Attribut) per Web API.
     * So wird z. B. der Opportunity-Name verwendet, nicht der Kartentitel (der z. B. der Account-Name sein kann).
     */
    async function getRecordPrimaryName(entityName: string, entitySet: string, recordId: string): Promise<string | undefined> {
        const w = typeof window !== "undefined" ? (window as any) : undefined;
        const webApi: any = w?.Xrm?.WebApi?.online ?? w?.Xrm?.WebApi;
        if (!webApi || typeof webApi.retrieveRecord !== "function") return undefined;
        try {
            let selectAttr = "name";
            const util = w?.Xrm?.Utility;
            if (util && typeof util.getEntityMetadata === "function") {
                const metadata = await util.getEntityMetadata(entityName);
                const primary = (metadata as { PrimaryNameAttribute?: string })?.PrimaryNameAttribute;
                if (primary) selectAttr = primary;
            }
            const rec = await webApi.retrieveRecord(entityName, recordId, `?$select=${selectAttr}`);
            const value = rec?.[selectAttr];
            return typeof value === "string" && value.trim() ? value.trim() : undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Opens the related SharePoint folder in a new browser tab.
     * Opportunity-Hierarchie: SharePointSite → Account-Location → opportunity-Root → Opportunity-Location.
     * Siehe docs/SHAREPOINT_DEBUG.md.
     */
    const openSharePointFolderInNewTab = useCallback(async (
        entityName: string,
        id: string,
        recordDisplayName?: string | null
    ): Promise<void> => {
        if (!id) return;

        const w = typeof window !== "undefined" ? (window as any) : undefined;
        const webApi: any = w?.Xrm?.WebApi?.online ?? w?.Xrm?.WebApi;
        if (!webApi?.retrieveMultipleRecords || !webApi?.execute) return;

        const cleanId = id.replace(/[{}]/g, "");
        const DEBUG = "[Kanban SharePoint]";
        let usedAddOrEditLocation = false;

        try {
            const existingResult = await webApi.retrieveMultipleRecords(
                "sharepointdocumentlocation",
                `?$select=sharepointdocumentlocationid` +
                `&$filter=_regardingobjectid_value eq ${cleanId} and statecode eq 0` +
                `&$top=1`
            );
            const existing: any[] = existingResult?.entities ?? [];
            let locationId: string | undefined = existing[0]?.sharepointdocumentlocationid;

            if (!locationId) {
                console.warn(DEBUG, "No existing location, creating...", { entityName, cleanId });

                const entitySet = getEntitySetName(entityName);
                const recordName = (await getRecordPrimaryName(entityName, entitySet, cleanId))
                    ?? recordDisplayName?.trim()
                    ?? undefined;

                const guidSuffix = cleanId.replace(/-/g, "").toUpperCase();
                const namePart = recordName
                    ? sanitizeRelativeUrlName(recordName.trim())
                    : sanitizeRelativeUrlName(entityName);
                const folderName = namePart + " - _" + guidSuffix;

                let parentLocationId: string | undefined;

                if (entityName.toLowerCase() === "opportunity") {
                    const oppRecord = await webApi.retrieveRecord(
                        "opportunity",
                        cleanId,
                        "?$select=_parentaccountid_value"
                    );
                    const accountIdRaw = oppRecord?._parentaccountid_value;
                    const accountId = accountIdRaw != null ? String(accountIdRaw).replace(/[{}]/g, "") : undefined;

                    if (accountId) {
                        const accountLocResult = await webApi.retrieveMultipleRecords(
                            "sharepointdocumentlocation",
                            `?$select=sharepointdocumentlocationid` +
                            `&$filter=_regardingobjectid_value eq ${accountId} and statecode eq 0` +
                            `&$top=1`
                        );
                        const accountLocEntities: any[] = accountLocResult?.entities ?? [];
                        const accountLocationId = accountLocEntities[0]?.sharepointdocumentlocationid;

                        console.warn(DEBUG, "Account location", { accountId, accountLocationId });

                        if (accountLocationId) {
                            const oppRootResult = await webApi.retrieveMultipleRecords(
                                "sharepointdocumentlocation",
                                `?$select=sharepointdocumentlocationid` +
                                `&$filter=_parentsiteorlocation_value eq ${accountLocationId}` +
                                ` and relativeurl eq 'opportunity'` +
                                ` and _regardingobjectid_value eq null` +
                                ` and statecode eq 0` +
                                `&$top=1`
                            );
                            const oppRootEntities: any[] = oppRootResult?.entities ?? [];
                            parentLocationId = oppRootEntities[0]?.sharepointdocumentlocationid;

                            console.warn(DEBUG, "opportunity-root under account", {
                                accountLocationId,
                                found: parentLocationId ?? "(none)",
                            });

                            if (!parentLocationId) {
                                const rootPayload: Record<string, string> = {
                                    name: "opportunity",
                                    relativeurl: "opportunity",
                                    "parentsiteorlocation_sharepointdocumentlocation@odata.bind":
                                        `/sharepointdocumentlocations(${accountLocationId})`,
                                };
                                const pcfApi = context.webAPI as any;
                                const createdRoot = typeof pcfApi?.createRecord === "function"
                                    ? await pcfApi.createRecord("sharepointdocumentlocation", rootPayload)
                                    : await webApi.createRecord("sharepointdocumentlocation", rootPayload);
                                parentLocationId = createdRoot?.id ?? createdRoot?.entityId;
                                console.warn(DEBUG, "Created opportunity-root", { parentLocationId });
                            }
                        }
                    }
                }

                if (!parentLocationId) {
                    const genericRootResult = await webApi.retrieveMultipleRecords(
                        "sharepointdocumentlocation",
                        `?$select=sharepointdocumentlocationid` +
                        `&$filter=relativeurl eq '${entityName.replace(/'/g, "''")}' ` +
                        `and _regardingobjectid_value eq null and statecode eq 0` +
                        `&$top=1`
                    );
                    const genericRootEntities: any[] = genericRootResult?.entities ?? [];
                    parentLocationId = genericRootEntities[0]?.sharepointdocumentlocationid;
                    console.warn(DEBUG, "Generic entity-root fallback", { found: parentLocationId ?? "(none)" });
                }

                if (!parentLocationId) {
                    console.warn(DEBUG, "No parent location found, aborting");
                    return;
                }

                const clientUrl = getClientUrl();
                if (!clientUrl) {
                    console.warn(DEBUG, "No client URL for AddOrEditLocation");
                    return;
                }

                try {
                    locationId = await addOrEditLocation(
                        clientUrl,
                        parentLocationId,
                        entityName,
                        cleanId,
                        folderName
                    );
                    usedAddOrEditLocation = true;
                    console.warn(DEBUG, "AddOrEditLocation created location", { locationId });
                } catch (addErr) {
                    console.warn(DEBUG, "AddOrEditLocation failed, falling back to createRecord", addErr);
                    const createPayload: Record<string, string> = {
                        name: recordName ?? folderName,
                        relativeurl: folderName,
                        [`regardingobjectid_${entityName}@odata.bind`]: `/${entitySet}(${cleanId})`,
                        "parentsiteorlocation_sharepointdocumentlocation@odata.bind":
                            `/sharepointdocumentlocations(${parentLocationId})`,
                    };
                    const pcfApi = context.webAPI as any;
                    const created = typeof pcfApi?.createRecord === "function"
                        ? await pcfApi.createRecord("sharepointdocumentlocation", createPayload)
                        : await webApi.createRecord("sharepointdocumentlocation", createPayload);
                    locationId = created?.id ?? created?.entityId;
                    if (locationId) await new Promise((resolve) => setTimeout(resolve, 1500));
                }

                if (!locationId) {
                    console.warn(DEBUG, "No location id after create");
                    return;
                }
            }

            // Resolve absolute URL and open SharePoint folder
            const request: any = {
                entity: { entityType: "sharepointdocumentlocation", id: locationId },
                getMetadata: () => ({
                    boundParameter: "entity",
                    parameterTypes: {
                        entity: {
                            typeName: "Microsoft.Dynamics.CRM.sharepointdocumentlocation",
                            structuralProperty: 5,
                        },
                    },
                    operationType: 1,
                    operationName: "RetrieveAbsoluteAndSiteCollectionUrl",
                }),
            };

            const response = await webApi.execute(request);
            if (!response?.ok || typeof response.json !== "function") return;
            const body = await response.json();
            const absoluteUrl: string | undefined = body?.AbsoluteUrl || body?.absoluteurl;
            if (!absoluteUrl) return;

            if (!usedAddOrEditLocation) await ensureSharePointFolderExists(absoluteUrl);
            if (typeof window !== "undefined" && window.open) {
                window.open(absoluteUrl, "_blank", "noopener,noreferrer");
            } else {
                context.navigation.openUrl(absoluteUrl);
            }
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : (err && typeof (err as any).message === "string")
                    ? (err as any).message
                    : (typeof err === "object" && err !== null)
                        ? JSON.stringify(err)
                        : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            console.warn(DEBUG, "Error", { message, stack, fullError: err });
        }
    }, [context]);

    return useMemo(
        () => ({
            openForm,
            openEntityInNewTab,
            createNewRecord,
            openCreateActivityForm,
            openSharePointFolderInNewTab,
        }),
        [openForm, openEntityInNewTab, createNewRecord, openCreateActivityForm, openSharePointFolderInNewTab]
    );
}
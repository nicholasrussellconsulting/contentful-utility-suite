import * as contentful from "contentful-management";
import { Space } from "./types.js";

export type RecursivelyGatherSystemIDsRes = {
    entries: string[];
    assets: string[];
};

export type RecursivelyGatherSystemIDsParams = {
    space: Space;
    environmentID: string;
    parentIDs: string[];
};

export const recursivelyGatherSystemIDs = async ({
    environmentID,
    parentIDs,
    space,
}: RecursivelyGatherSystemIDsParams): Promise<RecursivelyGatherSystemIDsRes> => {
    const client = contentful.createClient({
        accessToken: space.managementToken as string,
    });
    let c_space: contentful.Space | undefined = undefined;
    let environment: contentful.Environment | undefined = undefined;
    try {
        c_space = await client.getSpace(space.spaceID);
    } catch (e) {
        throw new Error("Error: Space ID was incorrect");
    }
    try {
        environment = await (c_space as contentful.Space).getEnvironment(environmentID);
    } catch (e) {
        throw new Error("Error: Environment ID was incorrect");
    }

    const visited = new Set<string>();
    const allEntryIDs = new Set<string>(parentIDs);
    const allAssetIDs = new Set<string>();

    for (const parentID of parentIDs) {
        const { entryIDs, assetIDs } = await fetchEntryAndGetLinksRecursively(c_space, environment, parentID, visited);
        entryIDs.forEach((id) => allEntryIDs.add(id));
        assetIDs.forEach((id) => allAssetIDs.add(id));
    }

    return {
        entries: Array.from(allEntryIDs),
        assets: Array.from(allAssetIDs),
    };
};

async function fetchEntryAndGetLinksRecursively(
    space: contentful.Space,
    environment: contentful.Environment,
    itemID: string,
    visited: Set<string>,
): Promise<{ entryIDs: string[]; assetIDs: string[] }> {
    if (visited.has(itemID)) {
        return { entryIDs: [], assetIDs: [] };
    }

    visited.add(itemID);
    let item: contentful.Entry | contentful.Asset | undefined = undefined;
    let itemType: "entry" | "asset" = "entry";
    try {
        item = await environment.getEntry(itemID);
    } catch (e) {
        try {
            item = await environment.getAsset(itemID);
            itemType = "asset";
        } catch (e) {
            throw new Error(`A system ID you provided doesn't exist as an entry or asset: ${itemID}`);
        }
    }
    const entryIDs: string[] = [];
    const assetIDs: string[] = [];

    if (itemType === "entry") {
        const entry = item as contentful.Entry;

        Object.keys(entry.fields).forEach((fieldKey) => {
            const localizedField = entry.fields[fieldKey];

            Object.keys(localizedField).forEach((locale) => {
                const fieldValue = localizedField[locale];
                if (Array.isArray(fieldValue)) {
                    fieldValue.forEach((item) => {
                        if (item?.sys?.id && !visited.has(item.sys.id)) {
                            if (item.sys.linkType === "Entry") {
                                entryIDs.push(item.sys.id);
                            } else if (item.sys.linkType === "Asset") {
                                assetIDs.push(item.sys.id);
                            }
                        }
                    });
                } else if (fieldValue?.sys?.id && !visited.has(fieldValue.sys.id)) {
                    if (fieldValue.sys.linkType === "Entry") {
                        entryIDs.push(fieldValue.sys.id);
                    } else if (fieldValue.sys.linkType === "Asset") {
                        assetIDs.push(fieldValue.sys.id);
                    }
                }
            });
        });

        for (const linkedID of entryIDs) {
            const { entryIDs: childEntries, assetIDs: childAssets } = await fetchEntryAndGetLinksRecursively(
                space,
                environment,
                linkedID,
                visited,
            );
            entryIDs.push(...childEntries);
            assetIDs.push(...childAssets);
        }
    }

    if (itemType === "asset") {
        const asset = item as contentful.Asset;
        assetIDs.push(asset.sys.id);
    }

    return { entryIDs, assetIDs };
}

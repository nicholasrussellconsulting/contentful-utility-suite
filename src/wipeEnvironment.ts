import contentful from "contentful-management";
import { Space } from "./types.js";

const { createClient } = contentful;

export async function wipeEnvironment({ space, environmentID }: { space: Space; environmentID: string }) {
    const client = createClient({
        accessToken: space.managementToken as string,
    });
    const _space = await client.getSpace(space.spaceID);
    const env = await _space.getEnvironment(environmentID);

    const [entries, assets] = await Promise.all([env.getEntries(), env.getAssets()]);

    for (const entry of entries.items) {
        try {
            if (entry.isPublished()) await entry.unpublish();
            await entry.delete();
        } catch (err) {
            throw new Error(`Error deleting entry ${entry.sys.id}: ${(err as Error).message}`);
        }
    }

    for (const asset of assets.items) {
        try {
            if (asset.isPublished()) await asset.unpublish();
            await asset.delete();
        } catch (err) {
            throw new Error(`Error deleting asset ${asset.sys.id}: ${(err as Error).message}`);
        }
    }
    const contentTypes = await env.getContentTypes();

    for (const ct of contentTypes.items) {
        try {
            if (ct.sys.publishedVersion) {
                await ct.unpublish();
            }
            await ct.delete();
        } catch (err) {
            console.error(`Error deleting content type ${ct.sys.id}: ${(err as Error).message}`);
        }
    }
}

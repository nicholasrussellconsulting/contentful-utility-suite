import { recursivelyGatherSystemIDs } from "./recursivelyGatherSystemIDs.js";
import { spawnSync } from "child_process";
import { APIWrapper, Space } from "./types.js";
import { Utils } from "./Utils.js";
import { EXPORT_CONTENT_DIR, EXPORT_CONTENT_FILE_NAME } from "./constants.js";
import { mkdirSync } from "fs";

export type CreateContentExportParams = {
    parentIDsJSONFilePath: string;
    environmentID: string;
    space: Space;
};

export const createContentExport = async ({
    parentIDsJSONFilePath,
    environmentID,
    space,
}: CreateContentExportParams): Promise<APIWrapper<{ path?: string }>> => {
    if (!space.managementToken) {
        return {
            error: true,
            errorMessage:
                "Your Space config is missing the Management Token. You cannot complete this functionality without this parameter.",
        };
    }
    const fileContent = Utils.readFile(parentIDsJSONFilePath);
    const parentIDs: string[] = JSON.parse(fileContent);
    if (!Array.isArray(parentIDs) || !parentIDs.every((id) => typeof id === "string")) {
        return {
            error: true,
            errorMessage: "Error: JSON file was malformed",
        };
    }
    mkdirSync(EXPORT_CONTENT_DIR, { recursive: true });
    const res = await recursivelyGatherSystemIDs({ environmentID, parentIDs, space });
    const command = "npx";
    const args = [
        "contentful-cli",
        "space",
        "export",
        "--space-id",
        space.spaceID,
        "--management-token",
        space.managementToken,
        "--environment-id",
        environmentID,
        "--content-only",
        "--skip-tags",
        "--download-assets",
        "--query-entries",
        `'sys.id[in]=${res.entries.join(",")}'`,
        "--query-assets",
        `'sys.id[in]=${res.assets.join(",")}'`,
        "--content-file",
        EXPORT_CONTENT_FILE_NAME,
        "--export-dir",
        EXPORT_CONTENT_DIR,
    ];
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: true,
    });
    if (result.status === 0) {
        return {
            error: false,
            res: {
                path: EXPORT_CONTENT_DIR + EXPORT_CONTENT_FILE_NAME,
            },
        };
    } else {
        return {
            error: true,
            errorMessage: "Command to export content failed",
        };
    }
};

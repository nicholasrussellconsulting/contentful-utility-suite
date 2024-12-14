import { EXPORT_ALL_CONTENT_FILE_NAME, EXPORT_CONTENT_DIR } from "./constants";
import { APIWrapper, ContentExport, Space } from "./types";
import { spawnSync } from "child_process";
import { Utils } from "./Utils";
import { mkdirSync } from "fs";

export type ExportSpaceParams = {
    space: Space;
    environmentID: string;
};

export const exportFullSpace = ({ environmentID, space }: ExportSpaceParams): APIWrapper<ContentExport> => {
    mkdirSync(EXPORT_CONTENT_DIR, { recursive: true });
    if (!space.managementToken) {
        return {
            error: true,
            errorMessage:
                "Your Space config is missing the Management Token. You cannot complete this functionality without this parameter.",
        };
    }
    const command = "npx";
    const args = [
        "contentful",
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
        "--content-file",
        EXPORT_ALL_CONTENT_FILE_NAME,
        "--export-dir",
        EXPORT_CONTENT_DIR,
    ];
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: true,
    });
    if (result.status !== 0) {
        return {
            error: false,
            errorMessage: "Content export failed",
        };
    }
    const fileContent = Utils.readFile(EXPORT_CONTENT_DIR + EXPORT_ALL_CONTENT_FILE_NAME);
    try {
        return {
            error: false,
            res: JSON.parse(fileContent),
        };
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
};

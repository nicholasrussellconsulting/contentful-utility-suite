import { EXPORT_ALL_CONTENT_FILE_NAME, EXPORT_CONTENT_DIR } from "./constants.js";
import { APIWrapper, ContentExport, Space } from "./types.js";
import { spawnSync } from "child_process";
import { Utils } from "./Utils.js";
import { mkdirSync } from "fs";

export type ExportSpaceParams = {
    space: Space;
    environmentID: string;
};

export const exportFullSpaceEnvironment = ({ environmentID, space }: ExportSpaceParams): APIWrapper<ContentExport> => {
    mkdirSync(EXPORT_CONTENT_DIR, { recursive: true });
    const exportedFileName = EXPORT_ALL_CONTENT_FILE_NAME({ envID: environmentID, spaceID: space.spaceID });
    if (!space.managementToken) {
        return {
            error: true,
            errorMessage:
                "Your Space config is missing the Management Token. You cannot complete this functionality without this parameter.",
        };
    }
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
        "--content-file",
        exportedFileName,
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
    const fileContent = Utils.readFile(EXPORT_CONTENT_DIR + exportedFileName);
    try {
        return {
            error: false,
            res: {
                entries: JSON.parse(fileContent),
                fileLocation: EXPORT_CONTENT_DIR + exportedFileName,
            },
        };
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
};

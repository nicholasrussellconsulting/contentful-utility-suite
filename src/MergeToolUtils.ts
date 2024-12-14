import { DIFF_FOLDER } from "./constants.js";
import { APIWrapper, Space } from "./types.js";
import { mkdirSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { Utils } from "./Utils.js";

export type SpaceAndTargetSource = {
    space: Space;
    targetEnvID: string;
    sourceEnvID: string;
};

export type SpaceTargetAndFileLocation = {
    space: Space;
    environmentID: string;
    fileLocation: string;
};

const generateContentTypeDiff = ({ sourceEnvID, space, targetEnvID }: SpaceAndTargetSource): APIWrapper<{ fileLocation: string }> => {
    if (!space.managementToken) {
        return {
            error: true,
            errorMessage:
                "Your Space config is missing the Management Token. You cannot complete this functionality without this parameter.",
        };
    }
    const fileName = DIFF_FOLDER + `diff-${Date.now()}.txt`;
    const command = `npx contentful merge show --management-token ${space.managementToken} --space-id ${space.spaceID} --se ${sourceEnvID} --te ${targetEnvID} > ${fileName}`;
    mkdirSync(DIFF_FOLDER, { recursive: true });
    execSync(command);
    if (Utils.fileExistsSync(fileName)) {
        return {
            error: false,
            res: {
                fileLocation: fileName,
            },
        };
    } else {
        return {
            error: true,
            errorMessage: "An unexpected error occurred, the existence of the diff file could not be verified",
        };
    }
};

const generateMigrationScript = ({ space, sourceEnvID, targetEnvID }: SpaceAndTargetSource) => {
    if (!space.managementToken) {
        return {
            error: true,
            errorMessage:
                "Your Space config is missing the Management Token. You cannot complete this functionality without this parameter.",
        };
    }
    const command = `npx contentful merge export --management-token ${space.managementToken} --space-id ${space.spaceID} --se ${sourceEnvID} --te ${targetEnvID}`;
    execSync(command);
};

export const runMigrationScript = ({ fileLocation, environmentID, space }: SpaceTargetAndFileLocation) => {
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
        "migration",
        "--space-id",
        space.spaceID,
        "--management-token",
        space.managementToken,
        "--environment-id",
        environmentID,
        fileLocation,
    ];
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: true,
    });
    if (result.status === 0) {
        return true;
    } else {
        return false;
    }
};

export const MergeToolUtils = {
    generateContentTypeDiff,
    generateMigrationScript,
    runMigrationScript,
};

import chalk from "chalk";
import { ConfigUtils } from "../ConfigUtils";
import { ContentfulManagementAPI } from "../ContentfulManagementAPI";
import { Utils } from "../Utils";
import { MergeToolUtils } from "../MergeToolUtils";
import { CONTENT_TYPE_MIGRATION_DIR } from "../constants";
import { importContent } from "../importContent";
import { createContentExport } from "../createContentExport";

export const MigrationProcess = async () => {
    const space = await ConfigUtils.selectSpace();
    const environmentDataRes = await ContentfulManagementAPI.getAllEnvironments(space);
    if (environmentDataRes.error) {
        console.log(chalk.red(`There was an error fetching environment data from Contentful: ${environmentDataRes.errorMessage}`));
        return;
    }
    const envOrAliasChoice = await Utils.choicesPrompt({
        message: "Would you like to use environments or aliases?",
        choices: ["Environments", "Aliases"],
    });
    let environmentChoices: string[] = [];
    if (envOrAliasChoice === "Aliases") {
        const aliases = (environmentDataRes.res?.items
            .map((item) => item.sys.aliases?.map((alias) => alias.sys.id))
            .flat()
            .filter((alias) => !!alias) || []) as string[];
        environmentChoices = Array.from(new Set(aliases));
    } else {
        const environments = environmentDataRes.res?.items.map((item) => item.name);
        environmentChoices = Array.from(new Set(environments));
    }
    const sourceEnvID = await Utils.choicesPrompt({ choices: environmentChoices, message: "Select source environment" });
    const indexOfSource = environmentChoices.findIndex((env) => env === sourceEnvID);
    if (indexOfSource === -1) {
        throw new Error(`Unexpected error attempting to choose environments. This is most likely a code error.`);
    }
    const remainingChoices = [...environmentChoices.slice(0, indexOfSource), ...environmentChoices.slice(indexOfSource + 1)];
    const targetEnvID = await Utils.choicesPrompt({ choices: remainingChoices, message: "Select target environment" });
    const envConfirmation = await Utils.yesNoPrompt({
        question: `Please confirm you are migrating content from ${sourceEnvID} into ${targetEnvID}`,
    });
    if (!envConfirmation) {
        return;
    }
    console.log(
        `${chalk.blue("A great tool for content type merging already exists in the Contentful Marketplace here:")} ${chalk.green("https://www.contentful.com/marketplace/merge/")}`,
    );
    console.log(
        chalk.blue(
            `You can choose to have this CLI tool use the "Merge App" mentioned above on your behalf, or do it yourself through the UI and skip the Content Type merge step here`,
        ),
    );
    const migrationOption = await Utils.choicesPrompt({
        choices: ["Continue Normally (recommended)", "Skip Content Type Merge"],
        message: "Choose an option",
    });
    if (migrationOption === "Continue Normally (recommended)") {
        console.log(chalk.blue("Generating the merge diff..."));
        const diffResult = MergeToolUtils.generateContentTypeDiff({ space, sourceEnvID, targetEnvID });
        if (diffResult.error) {
            console.log(chalk.red(`There was an error creating the Content Type diff" ${diffResult.errorMessage}`));
            return;
        }
        const confirmDiff = await Utils.yesNoPrompt({
            question: `Please confirm you would like to apply the changes in this diff: ${diffResult.res?.fileLocation}`,
        });
        if (!confirmDiff) {
            return;
        }
        const mergeRes = MergeToolUtils.generateMigrationScript({ space, sourceEnvID, targetEnvID });
        if (mergeRes?.error) {
            console.log(chalk.red(`Error generation content type merge script: ${mergeRes.errorMessage}`));
            return;
        }
        const migrationFileRes = Utils.getMostRecentFileInDir(CONTENT_TYPE_MIGRATION_DIR);
        if (migrationFileRes.error) {
            console.log(chalk.red(`Error retrieving migration file: ${migrationFileRes.errorMessage}`));
            return;
        }
        const contentTypeMigrationSuccess = MergeToolUtils.runMigrationScript({
            environmentID: targetEnvID,
            fileLocation: migrationFileRes.res as string,
            space,
        });
        if (!contentTypeMigrationSuccess) {
            console.log(chalk.red("The content type migration script failed"));
            return;
        }
        console.log(chalk.green(`Successfully merged content types from ${sourceEnvID} to ${targetEnvID}`));
    }
    console.log(
        chalk.blue(
            "To determine what content will be migrated over, please provide the filename of a .json file in the root of the working directory that holds",
        ),
    );
    console.log(
        chalk.blue(
            "a single array of the Entry IDs you want to migrate over. You only have to provide the Entry IDs of the highest level parents.",
        ),
    );
    console.log(chalk.blue("All child IDs will be recursively discovered automatically."));
    const importFileName = await Utils.inputPrompt({
        message: "Provide imports file",
        defaultValue: "imports.json",
        validate: (s) => {
            if (!s.endsWith(".json")) {
                return "Must be a JSON file";
            }
            return true;
        },
    });
    const usableImportFileName = "./" + importFileName;
    const createExportRes = await createContentExport({
        environmentID: sourceEnvID,
        parentIDsJSONFilePath: usableImportFileName,
        space,
    });
    if (createExportRes.error) {
        console.log(chalk.red(`Error exporting content from ${sourceEnvID}: ${createExportRes.errorMessage}`));
    }
    const importConfirmation = await Utils.yesNoPrompt({
        question: `Please confirm content migration from ${sourceEnvID} to ${targetEnvID} with exports in this file ${createExportRes.res?.path}`,
    });
    if (!importConfirmation) {
        return;
    }
    const importSuccess = importContent({ environmentID: targetEnvID, path: createExportRes.res?.path as string, space });
    if (importSuccess) {
        console.log(chalk.green(`Successfully migrated content from ${sourceEnvID} to ${targetEnvID}`));
    } else {
        console.log(chalk.red("Failed to migrate content"));
    }
};

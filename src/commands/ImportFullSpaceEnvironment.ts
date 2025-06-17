import chalk from "chalk";
import { ConfigUtils } from "../ConfigUtils.js";
import { Utils } from "../Utils.js";
import { importContent } from "../importContent.js";
import { EXPORT_CONTENT_DIR } from "../constants.js";
import { mkdirSync } from "fs";
import { wipeEnvironment } from "../wipeEnvironment.js";

export const ImportFullSpaceEnvironment = async () => {
    mkdirSync(EXPORT_CONTENT_DIR, { recursive: true });
    const confirmed = await Utils.yesNoPrompt({
        question: `Before continuing, do you understand that this command could potentially overwrite every aspect of your environment?`,
        _default: false,
    });
    if (!confirmed) {
        return;
    }
    const space = await ConfigUtils.selectSpace();
    const environmentIDRes = await Utils.selectEnvironmentIDs({ space, selectOne: true, customMessage: "Select target environment" });
    if (environmentIDRes.error) {
        console.log(chalk.red(`There was an error selecting environment ID: ${environmentIDRes.errorMessage}`));
        return;
    }
    const environmentID = environmentIDRes.res?.id as string;
    const allFiles = Utils.getAllJsonFilesInDir(EXPORT_CONTENT_DIR);
    if (allFiles.error) {
        console.log(chalk.red(`There was an error reading files in the ${EXPORT_CONTENT_DIR} directory`));
        return;
    }
    if (!allFiles.res?.length) {
        console.log(
            chalk.red(
                `Found no applicable files in the ${EXPORT_CONTENT_DIR} directory, you can use the "Export Entire Environment" command to export the contents of a Contentful environment`,
            ),
        );
        return;
    }
    const fileChoice = await Utils.choicesPrompt<string>({
        choices: allFiles.res,
        message: "Please choose a file from the exports directory.",
    });
    if (!confirmed) {
        return;
    }
    const willUploadAssets = await Utils.yesNoPrompt({
        question: "Upload assets? (You only need to upload assets if you are importing across Spaces)",
        _default: false,
    });
    const willWipeEnvironment = await Utils.yesNoPrompt({
        question: `Do you want to delete all existing entries and assets in this environment before importing?`,
    });
    if (willWipeEnvironment) {
        console.log(chalk.yellow(`Deleting all content in Space: ${space.spaceID}, environment: ${environmentID}...`));
        await wipeEnvironment({ space, environmentID });
        console.log(chalk.green(`Successfully deleted all content in environment: ${environmentID}!`));
    }
    const importSuccess = importContent({
        environmentID,
        space,
        path: fileChoice,
        willUploadAssets,
    });
    if (importSuccess) {
        console.log(chalk.green(`Successfully imported into the ${environmentID} environment!`));
    } else {
        console.log(chalk.red("Failed to import content"));
    }
};

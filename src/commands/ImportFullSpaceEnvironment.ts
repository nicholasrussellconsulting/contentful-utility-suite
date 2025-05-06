import chalk from "chalk";
import { ConfigUtils } from "../ConfigUtils.js";
import { Utils } from "../Utils.js";
import { importContent } from "../importContent.js";
import { EXPORT_CONTENT_DIR } from "../constants.js";
import { mkdirSync } from "fs";

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
    const environmentIDRes = await Utils.selectEnvironmentIDs({ space, selectOne: true });
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
    const importSuccess = importContent({
        environmentID,
        space,
        path: fileChoice,
    });
    if (importSuccess) {
        console.log(chalk.green(`Successfully imported into the ${environmentID} environment!`));
    } else {
        console.log(chalk.red("Failed to import content"));
    }
};

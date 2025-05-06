import chalk from "chalk";
import { ConfigUtils } from "../ConfigUtils.js";
import { exportFullSpaceEnvironment } from "../exportFullSpaceEnvironment.js";
import { Utils } from "../Utils.js";

export const ExportFullSpaceEnvironment = async () => {
    const space = await ConfigUtils.selectSpace();
    const environmentIDRes = await Utils.selectEnvironmentIDs({ space, selectOne: true });
    if (environmentIDRes.error) {
        console.log(chalk.red(`There was an error selecting environment ID: ${environmentIDRes.errorMessage}`));
        return;
    }
    const environmentID = environmentIDRes.res?.id as string;
    const exportRes = exportFullSpaceEnvironment({ space, environmentID });
    if (exportRes.error) {
        console.log(chalk.red(`Error creating a full export: ${exportRes.errorMessage}`));
        return;
    }
    console.log(chalk.green(`Successfully exported entire environment to ${exportRes.res?.fileLocation}`));
};

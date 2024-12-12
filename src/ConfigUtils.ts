import chalk from "chalk";
import { CONFIG_PATH } from "./constants";
import { APIWrapper, ConfigShape, Space } from "./types";
import { Utils } from "./Utils";

let projectConfig: ConfigShape | undefined = undefined;

const updateOrCreateConfig = (json: ConfigShape): APIWrapper<undefined> => {
    let stringJSON: string | undefined = undefined;
    try {
        stringJSON = JSON.stringify(json);
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
    return Utils.createFileSync({ content: JSON.stringify(json), filePath: CONFIG_PATH });
};

const checkIfConfigExists = (): boolean => {
    return Utils.fileExistsSync(CONFIG_PATH);
};

const getConfigFileContents = (): APIWrapper<ConfigShape> => {
    const contents = Utils.readFile(CONFIG_PATH);
    try {
        const json: ConfigShape = JSON.parse(contents);
        return {
            error: false,
            res: json,
        };
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
};

const createNewConfig = async (): Promise<ConfigShape> => {
    const space: Partial<Space> = {};
    while (true) {
        space.spaceID = await Utils.inputPrompt({ message: `Please enter the "Space ID" of your Contentful Space` });
        space.managementToken = await Utils.inputPrompt({
            message: `Please enter a Management Token that has all environment/alias permissions for this space`,
        });
        space.deliveryToken = await Utils.inputPrompt({
            message: `Please enter a Delivery Token that has all environment/alias permissions for this space`,
        });
        const confirmed = await Utils.yesNoPrompt({ question: `Confirm the following config is correct: ${JSON.stringify(space)}` });
        if (confirmed) {
            break;
        }
    }
    updateOrCreateConfig({ spaces: [space as Space] });
    return {
        spaces: [space as Space],
    };
};

const checkAndInitConfig = async () => {
    if (!checkIfConfigExists()) {
        console.log(chalk.yellow("You do not have a config file. You will be prompted to create one now."));
        projectConfig = await createNewConfig();
    } else {
        const configRes = getConfigFileContents();
        if (configRes.error) {
            throw new Error(`There was an error reading config file: ${configRes.errorMessage}`);
        }
        projectConfig = configRes.res;
    }
};

export const ConfigUtils = {
    checkAndInitConfig,
};

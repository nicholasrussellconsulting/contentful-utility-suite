import chalk from "chalk";
import { APIWrapper, ConfigShape, Space } from "./types.js";
import { Utils } from "./Utils.js";
import { mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { APP_NAME } from "./constants.js";

const CONFIG_DIR = process.platform === "win32" ? join(homedir(), "AppData", "Roaming", APP_NAME) : join(homedir(), ".config", APP_NAME);
mkdirSync(CONFIG_DIR, { recursive: true });
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

let projectConfig: ConfigShape | undefined = undefined;

const updateOrCreateConfig = (json: ConfigShape): APIWrapper<undefined> => {
    let stringJSON: string | undefined = undefined;
    try {
        stringJSON = JSON.stringify(json, null, 2);
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
    return Utils.createFileSync({ content: stringJSON, filePath: CONFIG_PATH });
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

const createConfigSpace = async (): Promise<Space> => {
    const space: Partial<Space> = {};
    while (true) {
        space.name = await Utils.inputPrompt({
            message: `Please enter a name for the Contentful Space you will be using`,
            defaultValue: "Default Space",
            validate: (s) => {
                if (s.length < 1) {
                    return "Please enter a value";
                }
                if (projectConfig?.spaces.find((space) => space.name === s)) {
                    return "A Space with that name already exists";
                }
                return true;
            },
        });
        space.spaceID = await Utils.inputPrompt({
            message: `Please enter the "Space ID" of your Contentful Space`,
            validate: (s) => {
                if (s.length !== 12) {
                    return "Space IDs are 12 characters long";
                }
                if (projectConfig?.spaces.find((space) => space.spaceID === s)) {
                    return "A Space with that ID already exists";
                }
                return true;
            },
        });
        space.managementToken = await Utils.inputPrompt({
            message: `Please enter a Management Token that has all environment/alias permissions for this space`,
        });
        space.deliveryToken = await Utils.inputPrompt({
            message: `Please enter a Delivery Token that has all environment/alias permissions for this space`,
        });
        const confirmed = await Utils.yesNoPrompt({
            question: `Confirm the following config is correct:\n ${JSON.stringify(space, null, 2)}`,
        });
        if (confirmed) {
            const testAuthRes = await Utils.testSpaceAuthorization(space as Space);
            if (testAuthRes.error) {
                const confirmedError = await Utils.yesNoPrompt({
                    question: `Your credentials resulted in errors, they are almost certainly incorrect. Would you like to add this space into the config anyway?`,
                    _default: false,
                });
                if (confirmedError) {
                    break;
                }
            } else {
                break;
            }
        }
    }
    return space as Space;
};

const createAndWriteConfigSpace = async () => {
    const newSpace = await createConfigSpace();
    projectConfig = {
        spaces: [...(projectConfig?.spaces || []), newSpace],
    };
    updateOrCreateConfig(projectConfig);
};

const removeConfigSpace = async (): Promise<APIWrapper<undefined>> => {
    if ((projectConfig?.spaces.length || 0) < 2) {
        console.log(chalk.yellow("You only have one Space in your config. You cannot remove it."));
        return {
            error: false,
        };
    }
    const choice = await Utils.choicesPrompt({
        message: "Which Space would you like to remove?",
        choices: [...(projectConfig?.spaces.map((space) => space.name) || []), "Return"],
    });
    if (choice === "Return") {
        return {
            error: false,
        };
    }
    const index = projectConfig?.spaces.findIndex((space) => space.name === choice) || -1;
    if (index === -1) {
        throw new Error("Unexpected issue occurred most likely due to a bug in the code");
    }
    projectConfig = {
        spaces: [...(projectConfig?.spaces?.slice(0, index) || []), ...(projectConfig?.spaces.slice(index + 1) || [])],
    };
    updateOrCreateConfig(projectConfig);
    return {
        error: false,
    };
};

const updateConfigSpace = async (): Promise<APIWrapper<undefined>> => {
    const choice = await Utils.choicesPrompt({
        message: "Which Space would you like to update?",
        choices: [...(projectConfig?.spaces.map((space) => space.name) || []), "Return"],
    });
    if (choice === "Return") {
        return {
            error: false,
        };
    }
    const index = projectConfig?.spaces.findIndex((space) => space.name === choice) ?? -1;
    if (index === -1) {
        throw new Error("Unexpected issue occurred most likely due to a bug in the code");
    }
    const chosenSpace = projectConfig?.spaces[index] as Space;
    const updatingSpace: Partial<Space> = { ...chosenSpace };
    while (true) {
        updatingSpace.managementToken = await Utils.inputPrompt({
            message: `Update Management Token`,
            defaultValue: updatingSpace.managementToken,
        });
        updatingSpace.deliveryToken = await Utils.inputPrompt({
            message: `Update Delivery Token`,
            defaultValue: updatingSpace.deliveryToken,
        });
        const confirmed = await Utils.yesNoPrompt({
            question: `Confirm you would like to save these updates: ${JSON.stringify(updatingSpace, null, 2)}`,
        });
        if (confirmed) {
            const updatedConfig = {
                spaces: [
                    ...(projectConfig?.spaces?.slice(0, index) || []),
                    updatingSpace as Space,
                    ...(projectConfig?.spaces.slice(index + 1) || []),
                ],
            };
            projectConfig = updatedConfig;
            updateOrCreateConfig(updatedConfig);
            break;
        } else {
            break;
        }
    }
    return {
        error: false,
    };
};

const checkAndInitConfig = async () => {
    if (!checkIfConfigExists()) {
        console.log(chalk.yellow("You do not have a config file. You will be prompted to create one now."));
        const initSpace = await createConfigSpace();
        updateOrCreateConfig({ spaces: [initSpace] });
        projectConfig = {
            spaces: [initSpace],
        };
    } else {
        const configRes = getConfigFileContents();
        if (configRes.error) {
            throw new Error(`There was an error reading config file: ${configRes.errorMessage}`);
        }
        projectConfig = configRes.res;
    }
};

const selectSpace = async (): Promise<Space> => {
    const spaceChoice = await Utils.choicesPrompt({
        message: "Please choose a space",
        choices: projectConfig?.spaces.map((space) => space.name) || [],
    });
    return projectConfig?.spaces.find((space) => space.name === spaceChoice) as Space;
};

export const ConfigUtils = {
    checkAndInitConfig,
    createConfigSpace,
    removeConfigSpace,
    updateConfigSpace,
    createAndWriteConfigSpace,
    selectSpace,
};

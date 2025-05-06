import { existsSync, mkdirSync, readFileSync, writeFileSync, promises as fsPromises } from "fs";
import { dirname } from "path";
import {
    APIWrapper,
    ConfigShape,
    FetchGraphQLParams,
    GQLFieldsJSON,
    GQLFieldsJSONWithFileName,
    GraphQLNode,
    GraphQLResponse,
    Space,
} from "./types.js";
import inquirer from "inquirer";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { GQL_FIELDS_DIR, GQL_OUTPUT_DIR } from "./constants.js";
import { ContentfulManagementAPI } from "./ContentfulManagementAPI.js";
import { renameSync } from "fs";
import { parse, format } from "path";
import chalk from "chalk";

const fileExistsSync = (filePath: string): boolean => {
    return existsSync(filePath);
};

export type CreateFileSyncParams = {
    filePath: string;
    content: string;
};

const createFileSync = ({ content, filePath }: CreateFileSyncParams): APIWrapper<undefined> => {
    const dir = dirname(filePath);
    try {
        mkdirSync(dir, { recursive: true });
        writeFileSync(filePath, content, { flag: "w" });
    } catch (e) {
        return {
            errorMessage: (e as Error).message,
            error: true,
        };
    }
    return {
        error: false,
    };
};

export type YesNoPromptParams = {
    question: string;
    _default?: boolean;
};

const yesNoPrompt = async ({ question, _default }: YesNoPromptParams): Promise<boolean> => {
    const { answer } = await inquirer.prompt<{ answer: boolean }>([
        {
            type: "confirm",
            name: "answer",
            message: question,
            default: _default,
        },
    ]);
    return answer;
};

export type PromptWithChoicesParams<T extends string> = {
    message: string;
    choices: T[];
};

export const choicesPrompt = async <T extends string>({ message, choices }: PromptWithChoicesParams<T>): Promise<T> => {
    const { selectedChoice } = await inquirer.prompt<{ selectedChoice: T }>([
        {
            type: "list",
            name: "selectedChoice",
            message,
            choices,
        },
    ]);

    return selectedChoice;
};

export type InputPromptParams = {
    message: string;
    defaultValue?: string;
    validate?: (input: string) => string | boolean;
};

export const inputPrompt = async ({ message, defaultValue, validate }: InputPromptParams): Promise<string> => {
    const { userInput } = await inquirer.prompt<{ userInput: string }>([
        {
            type: "input",
            name: "userInput",
            message,
            default: defaultValue,
            validate,
        },
    ]);

    return userInput;
};

const readFile = (filePath: string): string => {
    return readFileSync(filePath, { encoding: "utf-8" });
};

const getMostRecentFileInDir = (directory: string): APIWrapper<string> => {
    try {
        const files = readdirSync(directory);
        if (files.length === 0) {
            return {
                error: true,
                errorMessage: "Directory is empty",
            };
        }
        const filesWithStats = files.map((file) => {
            const fullPath = join(directory, file);
            const stats = statSync(fullPath);
            return { file, fullPath, ctime: stats.ctime };
        });
        const mostRecentFile = filesWithStats.reduce((latest, current) => {
            return current.ctime > latest.ctime ? current : latest;
        });

        return {
            error: false,
            res: mostRecentFile.fullPath,
        };
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
};

export const getValidGraphQLFieldFiles = async (): Promise<APIWrapper<GQLFieldsJSONWithFileName[]>> => {
    mkdirSync(GQL_FIELDS_DIR, { recursive: true });
    try {
        const files = readdirSync(GQL_FIELDS_DIR);
        const gqlFiles = files.filter((file) => file.endsWith(".json"));
        const promises: Promise<GQLFieldsJSONWithFileName>[] = gqlFiles.map(async (file) => {
            const filePath = join(GQL_FIELDS_DIR, file);
            const content = await fsPromises.readFile(filePath, "utf-8");
            const parsed = JSON.parse(content) as GQLFieldsJSON;
            if (!parsed.collectionsKey || !parsed.fields.length) {
                throw new Error("failed");
            }
            return {
                ...parsed,
                fileName: file,
            };
        });

        const validFiles = (await Promise.allSettled(promises))
            .filter((promise) => promise.status === "fulfilled")
            .map((promise) => promise.value);

        return {
            error: false,
            res: validFiles,
        };
    } catch (error) {
        return {
            error: true,
            errorMessage: (error as Error).message,
        };
    }
};

const initGQLFieldsDir = (): APIWrapper<undefined> => {
    mkdirSync(GQL_FIELDS_DIR, { recursive: true });
    const example: GQLFieldsJSON = {
        collectionsKey: "pageCollection",
        fields: ["name", "slug"],
    };
    try {
        writeFileSync(GQL_FIELDS_DIR + "example.json", JSON.stringify(example, null, 2));
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
    return {
        error: false,
    };
};

async function fetchGraphQL<T>({ space, query, envID }: FetchGraphQLParams): Promise<GraphQLResponse<T>> {
    const res = await fetch(`https://graphql.contentful.com/content/v1/spaces/${space.spaceID}/environments/${envID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${space.deliveryToken}`,
        },
        body: JSON.stringify({ query }),
    });
    return (await res.json()) as GraphQLResponse<T>;
}

export type SelectEnvironmentIDsParams = {
    space: Space;
    selectOne?: boolean;
};

const selectEnvironmentIDs = async ({
    space,
    selectOne,
}: SelectEnvironmentIDsParams): Promise<APIWrapper<{ id: string; id2?: string }>> => {
    const environmentDataRes = await ContentfulManagementAPI.getAllEnvironments(space);
    if (environmentDataRes.error) {
        return {
            error: true,
            errorMessage: `There was an error fetching environment data from Contentful: ${environmentDataRes.errorMessage}`,
        };
    }
    const items = environmentDataRes.res?.items || [];
    if (items?.length < 2 && !selectOne) {
        return {
            error: true,
            errorMessage: `Your selected space must have at least 2 environments to use this command`,
        };
    }
    const envOrAliasChoice = await Utils.choicesPrompt({
        message: "Would you like to use environments or aliases?",
        choices: ["Environments", "Aliases"],
    });
    let environmentChoices: string[] = [];
    if (envOrAliasChoice === "Aliases") {
        const aliases = (items
            .map((item) => item.sys.aliases?.map((alias) => alias.sys.id))
            .flat()
            .filter((alias) => !!alias) || []) as string[];
        environmentChoices = Array.from(new Set(aliases));
    } else {
        const environments = items.map((item) => item.name);
        environmentChoices = Array.from(new Set(environments));
    }
    if (environmentChoices.length < 1) {
        return {
            error: true,
            errorMessage: `You have no available ${envOrAliasChoice === "Aliases" ? "aliases" : "environments"}`,
        };
    }
    if (environmentChoices.length < 2 && !selectOne) {
        return {
            error: true,
            errorMessage: `You need at least 2 ${envOrAliasChoice === "Aliases" ? "aliases" : "environments"}`,
        };
    }
    const sourceEnvID = await Utils.choicesPrompt({
        choices: environmentChoices,
        message: selectOne ? "Select an environment" : "Select source environment",
    });
    if (selectOne) {
        return {
            error: false,
            res: {
                id: sourceEnvID,
            },
        };
    }
    const indexOfSource = environmentChoices.findIndex((env) => env === sourceEnvID);
    if (indexOfSource === -1) {
        throw new Error(`Unexpected error attempting to choose environments. This is most likely a code error.`);
    }
    const remainingChoices = [...environmentChoices.slice(0, indexOfSource), ...environmentChoices.slice(indexOfSource + 1)];
    const targetEnvID = await Utils.choicesPrompt({ choices: remainingChoices, message: "Select target environment" });
    return {
        error: false,
        res: {
            id: sourceEnvID,
            id2: targetEnvID,
        },
    };
};

const writeGraphQLResponse = (content: GraphQLNode[], collectionsKey: string): APIWrapper<string> => {
    mkdirSync(GQL_OUTPUT_DIR, { recursive: true });

    const epoch = Math.floor(Date.now());
    const fileName = `${epoch}-${collectionsKey}.json`;
    const filePath = join(GQL_OUTPUT_DIR, fileName);

    const fileContent = JSON.stringify(content, null, 2);
    try {
        writeFileSync(filePath, fileContent, "utf-8");
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
    return {
        error: false,
        res: filePath,
    };
};

const toKebabCase = (input?: string): string => {
    return (
        input
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-") || ""
    );
};

const renameToCjs = (path: string) => {
    const { dir, name } = parse(path);
    const newFilePath = format({ dir, name, ext: ".cjs" });
    renameSync(path, newFilePath);
    return newFilePath;
};

const testSpaceAuthorization = async ({ spaceID, managementToken, deliveryToken }: Space): Promise<APIWrapper<true>> => {
    let possibleAuthIssue = false;
    console.log(chalk.yellow("Testing your information against Contentful..."));
    try {
        const managementRes = await fetch(`https://api.contentful.com/spaces/${spaceID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${managementToken}`,
            },
        });
        if (managementRes.status !== 200) {
            if (managementRes.status === 401) {
                possibleAuthIssue = true;
                console.log(chalk.red("Your management token test failed ❌"));
            } else {
                console.log(chalk.red(`Your space ID: ${spaceID} is (most likely) incorrect ❌`));
            }
            throw new Error(`Management step failure`);
        }
        const deliveryRes = await fetch(`https://cdn.contentful.com/spaces/${spaceID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${deliveryToken}`,
            },
        });
        if (deliveryRes.status !== 200) {
            possibleAuthIssue = true;
            console.log(chalk.red("Your delivery token test failed ❌"));
            throw new Error(`Delivery step failure`);
        }
        console.log(chalk.green("All tests passed, your Space is configured properly ✅"));
        return {
            error: false,
            res: true,
        };
    } catch (err) {
        if (possibleAuthIssue) {
            console.log(
                chalk.yellow(
                    `Please check if your API keys have expired: https://app.contentful.com/spaces/${spaceID}/api/keys and https://app.contentful.com/spaces/${spaceID}/api/cma_tokens`,
                ),
            );
        }
        return {
            error: true,
            errorMessage: (err as Error).message,
        };
    }
};

const getAllJsonFilesInDir = (directory: string): APIWrapper<string[]> => {
    try {
        const files = readdirSync(directory);
        const jsonFiles = files
            .map((file) => join(directory, file))
            .filter((fullPath) => {
                const isFile = statSync(fullPath).isFile();
                const isJson = fullPath.endsWith(".json");
                return isFile && isJson;
            });

        return {
            error: false,
            res: jsonFiles,
        };
    } catch (e) {
        return {
            error: true,
            errorMessage: (e as Error).message,
        };
    }
};

export const Utils = {
    fileExistsSync,
    createFileSync,
    yesNoPrompt,
    choicesPrompt,
    inputPrompt,
    readFile,
    getMostRecentFileInDir,
    getValidGraphQLFieldFiles,
    fetchGraphQL,
    initGQLFieldsDir,
    selectEnvironmentIDs,
    writeGraphQLResponse,
    toKebabCase,
    renameToCjs,
    testSpaceAuthorization,
    getAllJsonFilesInDir,
};

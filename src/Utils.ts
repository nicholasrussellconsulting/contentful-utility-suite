import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { APIWrapper } from "./types";
import inquirer from "inquirer";

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
    validate?: (input: string) => boolean;
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

export const Utils = {
    fileExistsSync,
    createFileSync,
    yesNoPrompt,
    choicesPrompt,
    inputPrompt,
    readFile,
};

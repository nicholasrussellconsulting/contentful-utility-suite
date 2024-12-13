import chalk from "chalk";
import { Utils } from "../Utils";
import { ConfigUtils } from "../ConfigUtils";
import { GQL_FIELDS_DIR } from "../constants";
import { runQuery } from "../runQuery";

export const ExportContent = async () => {
    const initGQLDirectoryRes = Utils.initGQLFieldsDir();
    if (initGQLDirectoryRes.error) {
        console.log(`There was an error initializing a directory: ${initGQLDirectoryRes.errorMessage}`);
        return;
    }
    while (true) {
        const filesRes = await Utils.getValidGraphQLFieldFiles();
        if (filesRes.error) {
            console.log(chalk.red(`There was an error getting a list of GraphQL files: ${filesRes.errorMessage}`));
            break;
        } else if (!filesRes.res?.length) {
            console.log(
                chalk.blue(
                    `You have no valid JSON files in the ${GQL_FIELDS_DIR} directory. Please add a valid JSON file, you can check the README.md for a valid structure.`,
                ),
            );
            const choice = await Utils.choicesPrompt({
                choices: ["Refresh", "Return"],
                message: "Refresh the list or return to the main menu?",
            });
            if (choice !== "Refresh") {
                break;
            }
        } else {
            const fileNameChoice = await Utils.choicesPrompt({
                choices: [...(filesRes.res.map((file) => file.fileName) || []), "Refresh", "Return"],
                message: "Please choose a JSON file to execute",
            });
            if (fileNameChoice === "Return") {
                break;
            } else if (fileNameChoice === "Refresh") {
            } else {
                const selectedSpace = await ConfigUtils.selectSpace();
                const selectedEnvironmentRes = await Utils.selectEnvironmentIDs({ space: selectedSpace, selectOne: true });
                if (selectedEnvironmentRes.error) {
                    console.log(chalk.red(selectedEnvironmentRes.errorMessage));
                    break;
                }
                const gqlFile = filesRes.res.find((file) => file.fields);
                if (!gqlFile) {
                    throw new Error("An unexpected error occurred, this is probably a code error.");
                }
                const queryRes = await runQuery({ envID: selectedEnvironmentRes.res?.id as string, space: selectedSpace, gqlFile });
                if (queryRes.error) {
                    console.log(chalk.red(`Error making the Contentful GraphQL query: ${queryRes.errorMessage}`));
                    break;
                }
                const writeResponse = Utils.writeGraphQLResponse(queryRes.res || [], gqlFile.collectionsKey);
                if (writeResponse.error) {
                    console.log(chalk.red(`Failed to write GraphQL content to file: ${writeResponse.errorMessage}`));
                }
                break;
            }
        }
    }
};

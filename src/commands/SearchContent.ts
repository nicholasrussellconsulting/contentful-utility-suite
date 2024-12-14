import chalk from "chalk";
import { ConfigUtils } from "../ConfigUtils";
import { exportFullSpace } from "../exportFullSpace";
import { Utils } from "../Utils";
import { searchEntries } from "../searchEntries";
import { writeFileSync, mkdirSync } from "fs";
import { SEARCH_RESULT_DIFF } from "../constants";

export const SearchContent = async () => {
    mkdirSync(SEARCH_RESULT_DIFF, { recursive: true });
    console.log(chalk.blue("Choose a space and environment to run the search"));
    const space = await ConfigUtils.selectSpace();
    const environmentIDRes = await Utils.selectEnvironmentIDs({ space, selectOne: true });
    if (environmentIDRes.error) {
        console.log(chalk.red(`There was an error selecting environment ID: ${environmentIDRes.errorMessage}`));
    }
    const environmentID = environmentIDRes.res?.id as string;
    const entriesRes = exportFullSpace({ environmentID, space });
    if (entriesRes.error) {
        console.log(chalk.red(`Error fetching content for search: ${entriesRes.errorMessage}`));
        return;
    }
    while (true) {
        const choice = await Utils.choicesPrompt({ choices: ["Enter Search String", "Return"], message: "Choose an option" });
        if (choice === "Return") {
            return;
        }
        const input = await Utils.inputPrompt({
            message: "Enter search string",
            defaultValue: "Search for this",
            validate: (s) => (s.length < 1 ? "Invalid" : true),
        });
        const searchRes = searchEntries(entriesRes.res?.entries || [], input);
        let success: boolean = false;
        const path =
            SEARCH_RESULT_DIFF +
            `results-${Utils.toKebabCase(space.name)}-${Utils.toKebabCase(environmentID)}-${Utils.toKebabCase(input.substring(0, 15))}.json`;
        try {
            writeFileSync(path, JSON.stringify(searchRes, null, 2));
            success = true;
        } catch (e) {
            console.log(`Error writing file: ${(e as Error).message}`);
        }
        if (success) {
            console.log(`${chalk.blue("Successfully wrote search result to file: ")} ${chalk.green(path)}`);
        }
    }
};

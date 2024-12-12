#!/usr/bin/env node

import chalk from "chalk";
import { ConfigUtils } from "./ConfigUtils";
import { Utils } from "./Utils";
import { UpdateConfig } from "./commands/UpdateConfig";
import { MergeProcess } from "./commands/MergeProcess";
import { ExportContent } from "./commands/ExportContent";
import { SearchContent } from "./commands/SearchContent";

const commandIndex = {
    "Update Config": UpdateConfig,
    "Merge Environments": MergeProcess,
    "Export Content": ExportContent,
    "Search Content": SearchContent,
    Exit: () => process.exit(0),
};

async function main() {
    console.log(chalk.blue("Welcome to Contentful Utility Suite"));
    await ConfigUtils.checkAndInitConfig();
    while (true) {
        const choice = await Utils.choicesPrompt({
            choices: ["Update Config", "Merge Environments", "Export Content", "Search Content", "Exit"],
            message: "Choose a command",
        });
        commandIndex[choice]();
    }
}

main();

#!/usr/bin/env node

import chalk from "chalk";
import { ConfigUtils } from "./ConfigUtils";
import { Utils } from "./Utils";
import { UpdateConfig } from "./commands/UpdateConfig";
import { MigrationProcess } from "./commands/MigrationProcess";
import { ExportContent } from "./commands/ExportContent";
import { SearchContent } from "./commands/SearchContent";

const commandIndex = {
    "Update Config": UpdateConfig,
    "Migrate Selected Content": MigrationProcess,
    "Export a Content Collection": ExportContent,
    "Search All Content": SearchContent,
    Exit: () => process.exit(0),
};

async function main() {
    console.log(chalk.blue("Welcome to Contentful Utility Suite"));
    await ConfigUtils.checkAndInitConfig();
    while (true) {
        const choice = await Utils.choicesPrompt({
            choices: ["Update Config", "Migrate Selected Content", "Export a Content Collection", "Search All Content", "Exit"],
            message: "Choose a command",
        });
        await commandIndex[choice]();
    }
}

main();

#!/usr/bin/env node

import chalk from "chalk";
import { ConfigUtils } from "./ConfigUtils.js";
import { Utils } from "./Utils.js";
import { UpdateConfig } from "./commands/UpdateConfig.js";
import { MigrationProcess } from "./commands/MigrationProcess.js";
import { ExportContent } from "./commands/ExportContent.js";
import { SearchContent } from "./commands/SearchContent.js";
import { ExportFullSpaceEnvironment } from "./commands/ExportFullSpaceEnvironment.js";
import { TestAuthentication } from "./commands/TestAuthentication.js";
import { ImportFullSpaceEnvironment } from "./commands/ImportFullSpaceEnvironment.js";
import updateNotifier from "update-notifier";

const commandIndex = {
    "Update Config": UpdateConfig,
    "Migrate Selected Content": MigrationProcess,
    "Export a Content Collection": ExportContent,
    "Search All Content": SearchContent,
    "Export Entire Environment": ExportFullSpaceEnvironment,
    "Import Environment from JSON": ImportFullSpaceEnvironment,
    "Test Authentication": TestAuthentication,
    Exit: () => process.exit(0),
};

async function main() {
    const notifier = updateNotifier({ pkg: { name: "contentful-utility-suite", version: "1.3.0" }, updateCheckInterval: 0 });
    notifier.notify();

    console.log(chalk.blue("Welcome to Contentful Utility Suite"));
    await ConfigUtils.checkAndInitConfig();
    while (true) {
        const choice = await Utils.choicesPrompt({
            choices: [
                "Update Config",
                "Migrate Selected Content",
                "Export a Content Collection",
                "Search All Content",
                "Export Entire Environment",
                "Import Environment from JSON",
                "Test Authentication",
                "Exit",
            ],
            message: "Choose a command",
        });
        await commandIndex[choice]();
    }
}

main();

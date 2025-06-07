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
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

updateNotifier({ pkg: packageJson, updateCheckInterval: 0 }).notify();

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

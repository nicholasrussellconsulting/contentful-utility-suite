import { ConfigUtils } from "../ConfigUtils.js";
import { Utils } from "../Utils.js";

export const UpdateConfig = async () => {
    while (true) {
        const choice = await Utils.choicesPrompt({
            message: "What would you like to do?",
            choices: ["Add Space", "Update Space", "Remove Space", "Return"],
        });
        switch (choice) {
            case "Return":
                return;
            case "Add Space":
                await ConfigUtils.createAndWriteConfigSpace();
                break;
            case "Remove Space":
                await ConfigUtils.removeConfigSpace();
                break;
            case "Update Space":
                await ConfigUtils.updateConfigSpace();
                break;
        }
    }
};

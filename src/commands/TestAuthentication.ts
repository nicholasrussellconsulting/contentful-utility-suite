import { ConfigUtils } from "../ConfigUtils.js";
import { Utils } from "../Utils.js";

export const TestAuthentication = async () => {
    const space = await ConfigUtils.selectSpace();
    const res = await Utils.testSpaceAuthorization(space);
};

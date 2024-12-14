import { CONTENTFUL_API_URL } from "./constants.js";
import { APIWrapper, EnvironmentResponse, Space } from "./types.js";

const getAllEnvironments = async (space: Space): Promise<APIWrapper<EnvironmentResponse>> => {
    try {
        const res = await fetch(CONTENTFUL_API_URL + `/spaces/${space.spaceID}/environments`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${space.managementToken}`,
            },
        });
        const json: EnvironmentResponse = await res.json();
        return {
            error: false,
            res: json,
        };
    } catch (err) {
        return {
            error: true,
            errorMessage: (err as Error).message,
        };
    }
};

export const ContentfulManagementAPI = {
    getAllEnvironments,
};

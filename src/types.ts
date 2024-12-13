export type ConfigShape = {
    spaces: Space[];
};

export type Space = {
    spaceID: string;
    managementToken?: string;
    deliveryToken?: string;
    name: string;
};

export type APIWrapper<T> = {
    res?: T;
    errorMessage?: string;
    error: boolean;
};

export type EnvironmentResponse = {
    total: number;
    limit: number;
    skip: number;
    sys: SystemType;
    items: EnvironmentItem[];
};

export type SystemType = {
    type: string;
};

export type EnvironmentItem = {
    name: string;
    sys: EnvironmentSys;
};

export type EnvironmentSys = {
    type: string;
    id: string;
    version: number;
    space: LinkType;
    status: LinkType;
    createdBy: LinkType;
    createdAt: string;
    updatedBy: LinkType;
    updatedAt: string;
    aliases?: LinkType[];
    aliasedEnvironment?: LinkType;
};

export type LinkType = {
    sys: LinkSys;
};

export type LinkSys = {
    type: "Link";
    linkType: string;
    id: string;
};

export type FetchGraphQLParams = {
    query: string;
    space: Space;
    envID: string;
};

export type GraphQLError = {
    message: string;
};

export type GraphQLResponse<T> = {
    data?: {
        [key: string]: {
            items: T[];
            total?: number;
        };
    };
    errors?: GraphQLError[];
};

export type GraphQLNode = {
    sys: {
        id: string;
    };
};

export type GQLFieldsJSON = {
    collectionsKey: string;
    fields: string[];
};

export type GQLFieldsJSONWithFileName = GQLFieldsJSON & { fileName: string };

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

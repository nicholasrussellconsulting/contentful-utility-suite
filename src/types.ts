export type ConfigShape = {
    spaces: Space[];
};

export type Space = {
    spaceID: string;
    managementToken?: string;
    deliveryToken?: string;
};

export type APIWrapper<T> = {
    res?: T;
    errorMessage?: string;
    error: boolean;
};

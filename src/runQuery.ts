import { APIWrapper, GQLFieldsJSON, GraphQLNode, Space } from "./types";
import { Utils } from "./Utils";

export type GetLocationContentParams = {
    envID: string;
    space: Space;
    gqlFile: GQLFieldsJSON;
};

export async function runQuery({ envID, space, gqlFile }: GetLocationContentParams): Promise<APIWrapper<GraphQLNode[]>> {
    const totalRes = await Utils.fetchGraphQL<GraphQLNode>({
        envID,
        space,
        query: `
            query {
                ${gqlFile.collectionsKey}(limit: 1) {
                    total
                }
            }
        `,
    });

    if (totalRes.errors) {
        return {
            error: true,
            errorMessage: totalRes.errors.map((err) => err.message)[0],
        };
    }

    const totalItems = totalRes.data?.[gqlFile.collectionsKey].total ?? 0;
    const items: GraphQLNode[] = [];

    for (let skip = 0; skip < totalItems; skip += 500) {
        const res = await Utils.fetchGraphQL<GraphQLNode>({
            envID,
            space,
            query: `
                query {
                    ${gqlFile.collectionsKey}(limit: 500, skip: ${skip}) {
                        items {
                            sys {
                                id
                            }
                            ${gqlFile.fields.join("\n")}
                        }
                    }
                }
            `,
        });

        if (res.errors?.length) {
            return {
                error: true,
                errorMessage: res.errors.map((err) => err.message).join("\n"),
            };
        }

        const fetchedItems = res.data?.[gqlFile.collectionsKey].items ?? [];
        items.push(...fetchedItems);
    }

    return {
        error: false,
        res: items,
    };
}

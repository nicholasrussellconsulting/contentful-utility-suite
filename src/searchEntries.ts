import { CONTENTFUL_URL } from "./constants";
import { Entry } from "./types";

export type SearchEntriesResponse = {
    entryId: string;
    urn: string;
    matches: Record<string, string[]>;
    contentType: string;
    title: string | undefined;
};

export function searchEntries(
    entries: Entry[],
    searchString: string,
): Array<{ entryId: string; urn: string; matches: Record<string, string[]> }> {
    const results: SearchEntriesResponse[] = [];

    entries.forEach((entry) => {
        const { fields, sys } = entry;
        const matches: Record<string, string[]> = {};

        for (const [fieldKey, localizedField] of Object.entries(fields)) {
            const matchedLocales = Object.entries(localizedField).filter(
                ([locale, value]) => typeof value === "string" && value.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()),
            );

            if (matchedLocales.length > 0) {
                matches[fieldKey] = matchedLocales.map(([locale]) => locale);
            }
        }

        let title: string | undefined = undefined;
        if (fields.name) {
            title = fields.name["en-US"];
        }

        if (Object.keys(matches).length > 0) {
            results.push({
                entryId: sys.id,
                urn: convertUrnToUrl(sys.urn),
                matches,
                contentType: sys.contentType.sys.id,
                title,
            });
        }
    });

    return results;
}

function convertUrnToUrl(urn: string): string {
    const pattern = /.*?(spaces\/.*)/;
    return urn.replace(pattern, `${CONTENTFUL_URL}/$1`);
}

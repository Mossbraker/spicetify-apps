import { CollectionChild } from "../extensions/collections_wrapper";

function collectionSort(order: string, reverse: boolean): (a: CollectionChild, b: CollectionChild) => number {
    const sortBy = (a: CollectionChild, b: CollectionChild) => {
        if (a.pinned || b.pinned) return 0;
        switch (order) {
            case "0":
                return a.name.replace(/^the\s+/i, '').localeCompare(b.name.replace(/^the\s+/i, ''));
            case "1":
                return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            case "2":
                if (a.type === "collection") return -1;
                if (b.type === "collection") return 1;
                return a.artists[0].name.replace(/^the\s+/i, '').localeCompare(b.artists[0].name.replace(/^the\s+/i, ''));
            case "3":
                // Release Year — rely on API sort order where possible; local albums without release dates sort to the end.
                // Try to derive a release year from known properties; fall back to null when unavailable.
                {
                    const aAny = a as any;
                    const bAny = b as any;
                    const aYear: number | null =
                        typeof aAny.releaseYear === "number"
                            ? aAny.releaseYear
                            : aAny.releaseDate
                                ? new Date(aAny.releaseDate).getFullYear()
                                : null;
                    const bYear: number | null =
                        typeof bAny.releaseYear === "number"
                            ? bAny.releaseYear
                            : bAny.releaseDate
                                ? new Date(bAny.releaseDate).getFullYear()
                                : null;

                    // Items without a release year go to the end.
                    if (aYear === null && bYear === null) return 0;
                    if (aYear === null) return 1;
                    if (bYear === null) return -1;

                    // Newer releases first; reverse flag is handled by the wrapper returned below.
                    return bYear - aYear;
                }
            case "6":
                // @ts-ignore Date contructor does accept null as a parameter
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            default:
                return 0;
        }
    };

    return reverse ? (a: CollectionChild, b: CollectionChild) => sortBy(b, a) : sortBy;
}

export default collectionSort;
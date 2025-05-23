import {algoliasearch}  from "algoliasearch";

export const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID!,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY!
);

export const future = { preserveSharedStateOnUnmount: true };

export const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME!; 
export const looksIndexName = import.meta.env.VITE_ALGOLIA_LOOKS_INDEX_NAME!;


export interface ProductHit {
    name: string;
    description: string;
    image: string;
    price: number;
    objectID: string;
    __position: number;
    __queryID?: string;
  }
  
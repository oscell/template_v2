import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  Configure,
  DynamicWidgets,
  InstantSearch,
} from "react-instantsearch";
import { CustomHits } from "./components/Hit";

import { CustomSearchBox } from "./components/SearchBar";
import { CustomPagination } from "./components/CustomPagination";
import { CustomRefinementList } from "./components/customRefinementList";

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID!,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY!
);


const future = { preserveSharedStateOnUnmount: true };

export default function App() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto ">
        <InstantSearch
          searchClient={searchClient}
          indexName={import.meta.env.VITE_ALGOLIA_INDEX_NAME!}
          future={future}
          insights
        >
          <Configure hitsPerPage={9} />

          <div className="mb-4 flex justify-center">
            <div className="w-full max-w-md">
              <CustomSearchBox
                placeholder="Search products..."
                className="w-full"
              />
            </div>
          </div>

          {/* Main panel: filters on left, results on right */}
          <div className="flex gap-4">
            {/* Filters - take up to 1/3 */}
            <div className="w-full max-w-xs">
              <DynamicWidgets>
                <CustomRefinementList attribute="type" />
                <CustomRefinementList attribute="brand" />
                <CustomRefinementList attribute="price" />
                <CustomRefinementList attribute="rating" />
                <CustomRefinementList attribute="categories" />
                <CustomRefinementList attribute="popularity" />
                <CustomRefinementList attribute="price_range" />
              </DynamicWidgets>
            </div>

            {/* Results - take the remaining space */}
            <div className="flex-1">
              <CustomHits />
              <div className="mt-4">
                <CustomPagination />
              </div>
            </div>
          </div>
        </InstantSearch>
      </div>
    </div>
  );
}

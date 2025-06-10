import { CustomHits } from "./Hit";
import { CustomSearchBox } from "./SearchBar";
import { CustomPagination } from "./CustomPagination";
import { CustomRefinementList } from "./CustomRefinementList";
import { DynamicWidgets } from "react-instantsearch";
import { AutocompleteSearchBox } from "./SearchBar";
import { Autocomplete } from "./Autocomplete/Autocomplete";
import { searchClient, future, indexName } from "../lib/algolia";




export function SearchPage() {
  return (
<>

      <div className="mb-4 flex justify-center">
        <div className="w-full max-w-md">
          {/* <CustomSearchBox
            placeholder="Search products..."
            className="w-full"
          /> */}
          {/* <AutocompleteSearchBox
            placeholder="Search products..."
            className="w-full"
          /> */}
          <Autocomplete
            placeholder="Search products..."
            className="w-full"
            searchClient={searchClient}
          />

        </div>
      </div>


      <div className="flex gap-4">
        {/* Filters - take up to 1/3 */}
        <div className="w-full max-w-xs">
          <DynamicWidgets>
            <CustomRefinementList attribute="categories" />
            <CustomRefinementList attribute="brand" />
            <CustomRefinementList attribute="price" />
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
      </>
  );
} 
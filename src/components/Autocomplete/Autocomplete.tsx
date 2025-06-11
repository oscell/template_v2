import type { SearchClient } from "algoliasearch";
import type { BaseItem } from "@algolia/autocomplete-core";
import type { AutocompleteOptions } from "@algolia/autocomplete-js";

import {
  createElement,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot, Root } from "react-dom/client";

import {
  useHierarchicalMenu,
  usePagination,
  useSearchBox,
} from "react-instantsearch";
import { autocomplete } from "@algolia/autocomplete-js";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
import { debounce } from "@algolia/autocomplete-shared";

import {
  INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES,
  INSTANT_SEARCH_INDEX_NAME,
  INSTANT_SEARCH_QUERY_SUGGESTIONS,
} from "./constants";

import "@algolia/autocomplete-theme-classic";

type AutocompleteProps = Partial<AutocompleteOptions<BaseItem>> & {
  searchClient: SearchClient;
  className?: string;
};

type SetInstantSearchUiStateOptions = {
  query: string;
  category?: string;
};

// Refine types for getItems and ensure compatibility
interface Source {
  templates: Record<string, unknown>;
  getItems: (params: any) => Promise<any[]> | any[];
}

interface Item {
  label?: string;
  category?: string;
  query?: string;
  __autocomplete_qsCategory?: string;
}

function createRecentSearchesPlugin(setInstantSearchUiState) {
  return createLocalStorageRecentSearchesPlugin({
    key: "instantsearch",
    limit: 3,
    transformSource({ source }) {
      return {
        ...source,
        onSelect({ item }) {
          setInstantSearchUiState({
            query: item.label,
            category: item.category,
          });
        },
      };
    },
  });
}

function createQuerySuggestionsInCategoryPluginLocal(
  searchClient: SearchClient,
  currentCategory: string | undefined,
  setInstantSearchUiState: (options: SetInstantSearchUiStateOptions) => void
) {
  const recentSearches = createLocalStorageRecentSearchesPlugin({
    key: "instantsearch",
    limit: 3,
    transformSource({ source }: { source: Source }) {
      return {
        ...source,
        onSelect({ item }: { item: Item }) {
          setInstantSearchUiState({
            query: item.label || "",
            category: item.category || "",
          });
        },
      };
    },
  });

  return createQuerySuggestionsPlugin({
    searchClient,
    indexName: INSTANT_SEARCH_QUERY_SUGGESTIONS,
    getSearchParams() {
      return recentSearches.data!.getAlgoliaSearchParams({
        hitsPerPage: 3,
        facetFilters: currentCategory
          ? [
              `${INSTANT_SEARCH_INDEX_NAME}.facets.exact_matches.${INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0]}.value:${currentCategory}`,
            ]
          : [],
      });
    },
    transformSource({ source }: { source: Source }) {
      return {
        ...source,
        sourceId: "querySuggestionsInCategoryPlugin",
        onSelect({ item }: { item: Item }) {
          setInstantSearchUiState({
            query: item.query || "",
            category: item.__autocomplete_qsCategory || "",
          });
        },
        getItems(params: any) {
          if (!currentCategory) {
            return [];
          }
          return source.getItems(params);
        },
        templates: {
          ...source.templates,
          header({ items }: { items: any[] }) {
            if (items.length === 0) {
              return <Fragment />;
            }
            return (
              <Fragment>
                <span className="aa-SourceHeaderTitle">
                  In {currentCategory}
                </span>
                <span className="aa-SourceHeaderLine" />
              </Fragment>
            );
          },
        },
      };
    },
  });
}

function createQuerySuggestionsPluginLocal(
  searchClient: SearchClient,
  currentCategory: string | undefined,
  setInstantSearchUiState: (options: SetInstantSearchUiStateOptions) => void
) {
  const recentSearches = createLocalStorageRecentSearchesPlugin({
    key: "instantsearch",
    limit: 3,
    transformSource({ source }: { source: Source }) {
      return {
        ...source,
        onSelect({ item }: { item: Item }) {
          setInstantSearchUiState({
            query: item.label || "",
            category: item.category || "",
          });
        },
      };
    },
  });

  return createQuerySuggestionsPlugin({
    searchClient,
    indexName: INSTANT_SEARCH_QUERY_SUGGESTIONS,
    getSearchParams() {
      if (!currentCategory) {
        return recentSearches.data!.getAlgoliaSearchParams({
          hitsPerPage: 6,
        });
      }
      return recentSearches.data!.getAlgoliaSearchParams({
        hitsPerPage: 3,
        facetFilters: [
          `${INSTANT_SEARCH_INDEX_NAME}.facets.exact_matches.${INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0]}.value:-${currentCategory}`,
        ],
      });
    },
    categoryAttribute: [
      INSTANT_SEARCH_INDEX_NAME,
      "facets",
      "exact_matches",
      INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0],
    ],
    transformSource({ source }: { source: Source }) {
      return {
        ...source,
        sourceId: "querySuggestionsPlugin",
        onSelect({ item }: { item: Item }) {
          setInstantSearchUiState({
            query: item.query || "",
            category: item.__autocomplete_qsCategory || "",
          });
        },
        getItems(params: any) {
          return source.getItems(params);
        },
        templates: {
          ...source.templates,
          header({ items }: { items: any[] }) {
            if (!currentCategory || items.length === 0) {
              return <Fragment />;
            }
            return (
              <Fragment>
                <span className="aa-SourceHeaderTitle">
                  In other categories
                </span>
                <span className="aa-SourceHeaderLine" />
              </Fragment>
            );
          },
        },
      };
    },
  });
}

function createHitPlugin(searchClient: SearchClient) {
  return {
    getSources() {
      return [
        {
          sourceId: "hitPlugin",
          getItems({ query }) {
            if (!query) {
              return [];
            }

            return searchClient
              .searchSingleIndex({
                indexName: "instant_search", // Replace with your items index name
                searchParams: {
                  query,
                  hitsPerPage: 6,
                  attributesToSnippet: ["name:10"], // Adjust attributes as needed
                  snippetEllipsisText: "…",
                },
              })
              .then(({ hits }) => hits);
          },
          getItemUrl({ item }) {
            return item.url || `/items/${item.objectID}`;
          },
          templates: {
            header({ items }) {
              if (items.length === 0) {
                return "";
              }

              return (
                <Fragment>
                  <span className="aa-SourceHeaderTitle">Items</span>
                  <span className="aa-SourceHeaderLine"></span>
                </Fragment>
              );
            },
            item({ item }) {
              return (
                <div className="aa-ItemWrapper">
                  <a href={item.url} className="aa-ItemLink">
                    <div className="aa-ItemContent  flex flex-col items-center">
                      <div className="aa-ItemIcon aa-ItemIcon--picture aa-ItemIcon--alignTop">
                        <img
                          src={
                            item.image ||
                            item.imageUrl ||
                            "/placeholder-image.jpg"
                          }
                          alt={item.name || item.title || "Item"}
                        />
                      </div>
                      <div className="aa-ItemContentBody">
                        {item.price && (
                          <div
                            className="aa-ItemContentDescription"
                            style={{ color: "#000" }}
                          >
                            <strong>${item.price.toLocaleString()}</strong>
                          </div>
                        )}
                        <div className="aa-ItemContentTitle">
                          <div
                            className="aa-ItemContentTitle" 
                            dangerouslySetInnerHTML={{
                              __html:
                                item._snippetResult?.name?.value ||
                                item.name ||
                                item.title,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              );
            },
          },
        },
      ];
    },
  };
}

function createMerchPlugin(searchClient: SearchClient) {
  return {
    getSources() {
      return [
        {
          sourceId: "merchPlugin",
          getItems({ query }) {
            if (query.length !== 0) {
              return [];
            }

            return searchClient
              .searchSingleIndex({
                indexName: "instant_search", // Replace with your items index name
                searchParams: {
                  query,
                  hitsPerPage: 3,
                },
              })
              .then(({ hits }) => hits);
          },
          getItemUrl({ item }) {
            return item.url || `/items/${item.objectID}`;
          },
          templates: {
            header({ items }) {
              if (items.length === 0) {
                return "";
              }

              return (
                <Fragment>
                  <span className="aa-SourceHeaderTitle">Merchandise</span>
                  <span className="aa-SourceHeaderLine"></span>
                </Fragment>
              );
            },
            item({ item }) {
              return (
                <div className="aa-ItemWrapper">
                  <a
                    href={item.url || `/items/${item.objectID}`}
                    className="aa-ItemLink"
                  >
                    <div className="aa-ItemContent">
                      <img
                        src={
                          item.image ||
                          item.imageUrl ||
                          "/placeholder-image.jpg"
                        }
                        alt={item.name || item.title || "Item"}
                        className="max-w-full h-72 rounded-md object-cover mx-auto"
                      />
                    </div>
                  </a>
                </div>
              );
            },
          },
        },
      ];
    },
  };
}

// Updated Autocomplete component with conditional plugin loading
export function Autocomplete({
  searchClient,
  className,
  ...autocompleteProps
}: AutocompleteProps) {
  const autocompleteContainer = useRef<HTMLDivElement>(null);
  const panelRootRef = useRef<Root | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  const { query, refine: setQuery } = useSearchBox();
  const { items: categories, refine: setCategory } = useHierarchicalMenu({
    attributes: INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES,
  });
  const { refine: setPage } = usePagination();

  const [instantSearchUiState, setInstantSearchUiState] =
    useState<SetInstantSearchUiStateOptions>({ query });
  const [currentQuery, setCurrentQuery] = useState(query);

  const debouncedSetInstantSearchUiState = debounce(
    setInstantSearchUiState,
    500
  );

  useEffect(() => {
    setQuery(instantSearchUiState.query);
    instantSearchUiState.category && setCategory(instantSearchUiState.category);
    setPage(0);
  }, [instantSearchUiState]);

  const currentCategory = useMemo(
    () => categories.find(({ isRefined }) => isRefined)?.value,
    [categories]
  );

  // Create plugins conditionally based on query state
  const plugins = useMemo(() => {
    const recentSearches = createRecentSearchesPlugin(setInstantSearchUiState);
    const querySuggestionsInCategory =
      createQuerySuggestionsInCategoryPluginLocal(
        searchClient,
        currentCategory,
        setInstantSearchUiState
      );
    const querySuggestions = createQuerySuggestionsPluginLocal(
      searchClient,
      currentCategory,
      setInstantSearchUiState
    );

    // Always include both plugins, but they'll handle empty/non-empty queries internally
    const hitPlugin = createHitPlugin(searchClient);
    const merchPlugin = createMerchPlugin(searchClient);

    return [
      recentSearches,
      querySuggestionsInCategory,
      querySuggestions,
      hitPlugin,
      merchPlugin,
    ];
  }, [currentCategory, searchClient]);

  useEffect(() => {
    if (!autocompleteContainer.current) {
      return;
    }

    const autocompleteInstance = autocomplete({
      ...autocompleteProps,
      container: autocompleteContainer.current,
      initialState: { query },
      insights: true,
      plugins,
      openOnFocus: true,
      detachedMediaQuery: "(max-width: 768px)",
      defaultActiveItemId: 0,
      onReset() {
        setInstantSearchUiState({ query: "", category: currentCategory });
        setCurrentQuery("");
      },
      onSubmit({ state }) {
        setInstantSearchUiState({ query: state.query });
        setCurrentQuery(state.query);
      },
      onStateChange({ prevState, state }) {
        if (prevState.query !== state.query) {
          setCurrentQuery(state.query);
          debouncedSetInstantSearchUiState({
            query: state.query,
          });
        }
      },
      renderer: { createElement, Fragment, render: () => {} },
      render({ elements }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        const leftSources = [];
        const rightSources = [];

        if (elements) {
          for (const [key, value] of Object.entries(elements)) {
            if (
              key === "recentSearchesPlugin" ||
              key.includes("querySuggestions")
            ) {
              leftSources.push(value);
            } else if (key === "hitPlugin" || key === "merchPlugin") {
              rightSources.push(value);
            }
          }
        }

        const styleTag = createElement("style", {
          dangerouslySetInnerHTML: {
            __html: `
              /* Make the autocomplete panel much wider than the input and use Tailwind-like approach */
              @media screen and (min-width: 769px) {
                .aa-Panel {
                  width: 800px !important;
                  max-width: 90vw !important;
                  min-width: 600px !important;
                  left: 50% !important;
                  transform: translateX(-50%) !important;
                  margin-top: 0.5rem !important;
                  border-radius: 0.75rem !important;
                  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                  border: 1px solid rgb(229 231 235) !important;
                  background: white !important;
                  z-index: 50 !important;
                }
              }
              .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-List,
              .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-List {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;

              }
      
              /* Responsive design */
              @media screen and (max-width: 768px) {
                .aa-Panel {
                  width: 95vw !important;
                  min-width: auto !important;
                  left: 2.5vw !important;
                  transform: none !important;
                }
                .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-List,
                .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-List {
                  
                }
              }

              @media screen and (max-width: 480px) {
                .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-List,
                .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-List {
                  grid-template-columns: 1fr;
                }
              }
            `,
          },
        });


        panelRootRef.current.render(
          <div className="aa-PanelLayout aa-Panel--scrollable">
            {styleTag}
            <div className="aa-PanelSections flex gap-1.5 p-1.5">
              <div className="aa-PanelSection aa-PanelSection--left flex flex-col p-1 gap-1 w-1/3 min-w-[200px]">
                {leftSources}
              </div>
              <div className="aa-PanelSection aa-PanelSection--right flex flex-col p-1 gap-1 flex-1 w-2/3">
                {rightSources}
              </div>
            </div>
          </div>
        );
      },
    });

    return () => autocompleteInstance.destroy();
  }, [plugins]);

  return <div className={className} ref={autocompleteContainer} />;
}

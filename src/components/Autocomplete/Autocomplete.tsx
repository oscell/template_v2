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
                searchParameters: {
                  query,
                  hitsPerPage: 5,
                  attributesToSnippet: ["name:10", "description:15"], // Adjust attributes as needed
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
            item({ item, components }) {
              return (
                <div className="aa-ItemWrapper">
                  <a
                    href={item.url || `/items/${item.objectID}`}
                    className="aa-ItemLink"
                  >
                    <div className="aa-ItemContent">
                      <div className="aa-ItemIcon aa-ItemIcon--picture aa-ItemIcon--alignTop">
                        <img
                          src={
                            item.image ||
                            item.imageUrl ||
                            "/placeholder-image.jpg"
                          }
                          alt={item.name || item.title || "Item"}
                          width="40"
                          height="40"
                        />
                      </div>
                      <div className="aa-ItemContentBody">
                        <div className="aa-ItemContentTitle">
                          {components ? (
                            <components.Snippet hit={item} attribute="name" />
                          ) : (
                            item.name || item.title
                          )}
                        </div>
                        {item.description && (
                          <div className="aa-ItemContentDescription">
                            {components ? (
                              <components.Snippet
                                hit={item}
                                attribute="description"
                              />
                            ) : (
                              item.description
                            )}
                          </div>
                        )}
                        {item.category && (
                          <div className="aa-ItemContentDescription">
                            Category: <strong>{item.category}</strong>
                          </div>
                        )}
                        {item.price && (
                          <div
                            className="aa-ItemContentDescription"
                            style={{ color: "#000" }}
                          >
                            <strong>${item.price.toLocaleString()}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="aa-ItemActions">
                      <button
                        className="aa-ItemActionButton aa-DesktopOnly aa-ActiveOnly"
                        type="button"
                        title="Select"
                        style={{ pointerEvents: "none" }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="currentColor"
                        >
                          <path d="M18.984 6.984h2.016v6h-15.188l3.609 3.609-1.406 1.406-6-6 6-6 1.406 1.406-3.609 3.609h13.172v-4.031z" />
                        </svg>
                      </button>
                      {/* Add custom action button if needed */}
                      <button
                        className="aa-ItemActionButton"
                        type="button"
                        title="Add to favorites"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          // Add your custom action here
                          console.log("Item favorited:", item);

                          // If you have insights tracking, you can add it here
                          // insights.convertedObjectIDsAfterSearch({
                          //   eventName: 'Added to favorites',
                          //   index: item.__autocomplete_indexName,
                          //   objectIDs: [item.objectID],
                          //   queryID: item.__autocomplete_queryID,
                          // });
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="currentColor"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
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
            if (!query) {
              return [];
            }

            return searchClient
              .searchSingleIndex({
                indexName: "instant_search", // Replace with your items index name
                searchParameters: {
                  query,
                  hitsPerPage: 5,
                  attributesToSnippet: ["name:10", "description:15"], // Adjust attributes as needed
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
            item({ item, components }) {
              return (
                <div className="aa-ItemWrapper">
                  <a
                    href={item.url || `/items/${item.objectID}`}
                    className="aa-ItemLink"
                  >
                    <div className="aa-ItemContent">
                      <div className="aa-ItemIcon aa-ItemIcon--picture aa-ItemIcon--alignTop">
                        <img
                          src={
                            item.image ||
                            item.imageUrl ||
                            "/placeholder-image.jpg"
                          }
                          alt={item.name || item.title || "Item"}
                          width="40"
                          height="40"
                        />
                      </div>
                      <div className="aa-ItemContentBody">
                        <div className="aa-ItemContentTitle">
                          {components ? (
                            <components.Snippet hit={item} attribute="name" />
                          ) : (
                            item.name || item.title
                          )}
                        </div>
                        {item.description && (
                          <div className="aa-ItemContentDescription">
                            {components ? (
                              <components.Snippet
                                hit={item}
                                attribute="description"
                              />
                            ) : (
                              item.description
                            )}
                          </div>
                        )}
                        {item.category && (
                          <div className="aa-ItemContentDescription">
                            Category: <strong>{item.category}</strong>
                          </div>
                        )}
                        {item.price && (
                          <div
                            className="aa-ItemContentDescription"
                            style={{ color: "#000" }}
                          >
                            <strong>${item.price.toLocaleString()}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="aa-ItemActions">
                      <button
                        className="aa-ItemActionButton aa-DesktopOnly aa-ActiveOnly"
                        type="button"
                        title="Select"
                        style={{ pointerEvents: "none" }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="currentColor"
                        >
                          <path d="M18.984 6.984h2.016v6h-15.188l3.609 3.609-1.406 1.406-6-6 6-6 1.406 1.406-3.609 3.609h13.172v-4.031z" />
                        </svg>
                      </button>
                      {/* Add custom action button if needed */}
                      <button
                        className="aa-ItemActionButton"
                        type="button"
                        title="Add to favorites"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          // Add your custom action here
                          console.log("Item favorited:", item);
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="currentColor"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
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

              .aa-PanelSections {
                display: flex;
                gap: 1.5rem;
                padding: 1.5rem;
              }
      
              .aa-PanelSection {
                display: flex;
                flex-direction: column;
              }
      
              .aa-PanelSection--left {
                width: 35%;
                min-width: 200px;
              }
      
              .aa-PanelSection--right {
                width: 65%;
                flex: 1;
              }
      
              .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-List,
              .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-List {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
              }
      
              .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-ItemWrapper,
              .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-ItemWrapper {
                padding: 0.75rem;
                border-radius: 0.5rem;
                transition: background-color 0.15s ease-in-out;
              }

              .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-ItemWrapper:hover,
              .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-ItemWrapper:hover {
                background-color: rgb(249 250 251);
              }
      
              .aa-Source[data-autocomplete-source-id='hitPlugin'] img,
              .aa-Source[data-autocomplete-source-id='merchPlugin'] img {
                max-width: 100%;
                height: 80px;
                border-radius: 0.375rem;
                object-fit: cover;
                display: block;
                margin: 0 auto;
              }

              /* Style the left section sources */
              .aa-PanelSection--left .aa-Source {
                margin-bottom: 1rem;
              }

              .aa-PanelSection--left .aa-SourceHeaderTitle {
                font-weight: 600;
                color: rgb(55 65 81);
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
              }

              .aa-PanelSection--left .aa-Item {
                padding: 0.5rem 0.75rem;
                border-radius: 0.375rem;
                transition: background-color 0.15s ease-in-out;
                color: rgb(75 85 99);
              }

              .aa-PanelSection--left .aa-Item:hover,
              .aa-PanelSection--left .aa-Item[aria-selected="true"] {
                background-color: rgb(243 244 246);
              }

              /* Right section header styling */
              .aa-PanelSection--right .aa-SourceHeaderTitle {
                font-weight: 600;
                color: rgb(55 65 81);
                font-size: 1rem;
                margin-bottom: 1rem;
              }
      
              /* Responsive design */
              @media screen and (max-width: 768px) {
                .aa-Panel {
                  width: 95vw !important;
                  min-width: auto !important;
                  left: 2.5vw !important;
                  transform: none !important;
                }

                .aa-PanelSections {
                  flex-direction: column;
                  padding: 1rem;
                  gap: 1rem;
                }
      
                .aa-PanelSection--left,
                .aa-PanelSection--right {
                  width: 100%;
                }
      
                .aa-Source[data-autocomplete-source-id='hitPlugin'] .aa-List,
                .aa-Source[data-autocomplete-source-id='merchPlugin'] .aa-List {
                  grid-template-columns: repeat(2, 1fr);
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
            <div className="aa-PanelSections">
              <div className="aa-PanelSection aa-PanelSection--left">
                {leftSources}
              </div>
              <div className="aa-PanelSection aa-PanelSection--right">
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

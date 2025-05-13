import { usePagination } from "react-instantsearch";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function CustomPagination(props) {
  const {
    pages,
    currentRefinement,
    nbPages,
    isFirstPage,
    isLastPage,
    refine,
    createURL,
  } = usePagination(props);

  const handleClick = (event, page) => {
    if (
      event.button !== 0 || // Not left click
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    refine(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={createURL(currentRefinement - 1)}
            onClick={(e) => handleClick(e, currentRefinement - 1)}
            aria-disabled={isFirstPage}
          />
        </PaginationItem>

        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={createURL(page)}
              onClick={(e) => handleClick(e, page)}
              isActive={currentRefinement === page}
            >
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        {nbPages > pages[pages.length - 1] + 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href={createURL(currentRefinement + 1)}
            onClick={(e) => handleClick(e, currentRefinement + 1)}
            aria-disabled={isLastPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

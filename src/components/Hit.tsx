import { useHits } from "react-instantsearch";

import { Highlight } from "react-instantsearch";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Hit } from "algoliasearch";

type HitProps = {
  hit: Hit;
};

function Hit({ hit }: HitProps) {

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Highlight attribute="name" hit={hit} />
        </CardTitle>

        <img
          src={hit.image as string}
        />

        <CardDescription>
          <Highlight attribute="description" hit={hit} />
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex justify-between"></CardFooter>
    </Card>
  );
}

export function CustomHits(props: any) {
  const { items } = useHits<Hit>(props);
  console.log("Algolia Hits:", items); // Log all hits here


  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {items.map((hit) => (
        <div key={hit.objectID}>
          <Hit hit={hit} />
        </div>
      ))}
    </div>
  );
}

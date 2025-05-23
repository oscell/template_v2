import { useHits, Highlight } from "react-instantsearch";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductHit {
  name: string;
  description: string;
  image: string;
  price: number;
  objectID: string;
  __position: number;
  __queryID?: string;
}

type HitProps = {
  hit: ProductHit;
};

function Hit({ hit }: HitProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="h-full cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/product/${hit.objectID}`)}
    >
      <CardHeader>
        <CardTitle>
          <Highlight attribute="name" hit={hit} />
        </CardTitle>

        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={hit.image}
            alt={hit.name}
            className="w-full h-full object-cover"
          />
        </div>

        <CardDescription>
          <Highlight attribute="description" hit={hit} />
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex justify-between">
        <span className="text-lg font-semibold">${hit.price}</span>
      </CardFooter>
    </Card>
  );
}

export function CustomHits() {
  const { items } = useHits<ProductHit>();

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

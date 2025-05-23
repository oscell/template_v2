import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { searchClient, indexName, ProductHit } from "../lib/algolia";

import { useState, useEffect } from "react";

export function CarouselSize({ items }: { items: Product[] }) {

    if (items.length === 0) {
        return <div className="p-4">No items found</div>;
    }

  return (
    <Carousel
      opts={{
        align: "start",
        skipSnaps: false,
        containScroll: "trimSnaps",
        dragFree: false,
        slidesToScroll: 3,
      }}
      className="w-full max-w-sm"
    >
      <CarouselContent>
        {Array.from({ length: 6 }).map((_, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

interface Product {
  objectID: string;
  name: string;
  description: string;
  image: string;
  price: number;
  color?: string;
  subcategories?: string[];
}

interface GetTheLookProps {
  productId: string;
}

export function GetTheLook({ productId }: GetTheLookProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const productData = await searchClient.getObject({
          indexName,
          objectID: productId,
        });
        setProduct(productData as Product);

        console.log(productData);




      } catch (err) {
        setError("Failed to load product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !product) {
    return <div className="p-4">Look not found</div>;
  }

  return <CarouselSize items={items} />;
}

import * as React from "react";
import { useHits } from "react-instantsearch";

import { Highlight } from "react-instantsearch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HitType = {
  objectID: string;
  name: string;
  description: string;
  framework: string;
};

type HitProps = {
  hit: HitType;
};

function Hit({ hit }: HitProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Highlight attribute="name" hit={hit} />
        </CardTitle>
        <CardDescription>
          <Highlight attribute="description" hit={hit} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor={`name-${hit.objectID}`}>Name</Label>
              <Input
                id={`name-${hit.objectID}`}
                placeholder="Name of your project"
                defaultValue={hit.name}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor={`framework-${hit.objectID}`}>Framework</Label>
              <Select defaultValue={hit.framework}>
                <SelectTrigger id={`framework-${hit.objectID}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="sveltekit">SvelteKit</SelectItem>
                  <SelectItem value="astro">Astro</SelectItem>
                  <SelectItem value="nuxt">Nuxt.js</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  );
}

export function CustomHits(props: any) {
  const { items } = useHits<HitType>(props);

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {items.map((hit) => (
        <div
          key={hit.objectID}
        >
          <Hit hit={hit} />
        </div>
      ))}
    </div>
  );
}

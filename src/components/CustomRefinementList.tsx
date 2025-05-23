import React from 'react';
import { useRefinementList } from 'react-instantsearch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function CustomRefinementList(props) {
  const {
    items,
    refine,
    searchForItems,
    canToggleShowMore,
    isShowingMore,
    toggleShowMore,
  } = useRefinementList(props);

  return (
    <div className="space-y-4 mb-6">
      <Input
        type="search"
        placeholder="Search filters..."
        onChange={(event) => searchForItems(event.currentTarget.value)}
        maxLength={512}
        spellCheck={false}
      />

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center space-x-2">
            <Checkbox
              id={`refine-${item.label}`}
              checked={item.isRefined}
              onCheckedChange={() => refine(item.value)}
            />
            <Label htmlFor={`refine-${item.label}`} className="flex-1">
              {item.label} <span className="text-muted-foreground">({item.count})</span>
            </Label>
          </li>
        ))}
      </ul>

      {canToggleShowMore && (
        <Button variant="outline" onClick={toggleShowMore}>
          {isShowingMore ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}

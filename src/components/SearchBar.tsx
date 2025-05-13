'use client';

import { Input } from "@/components/ui/input";
import { useState, useRef } from 'react';
import {  useSearchBox } from 'react-instantsearch';

export function CustomSearchBox(props) {
  const { query, refine } = useSearchBox(props);
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef(null);

  function setQuery(newQuery) {
    setInputValue(newQuery);
    refine(newQuery);
  }

  return (
    <>
      <Input
        ref={inputRef}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder="Search for products"
        spellCheck={false}
        maxLength={512}
        type="search"
        value={inputValue}
        onChange={(event) => setQuery(event.currentTarget.value)}
        autoFocus
      />
    </>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";


/**
 * Hook for managing a single URL query parameter in Next.js App Router
 * Works similarly to useState but syncs with URL query parameters
 *
 * @param key - The query parameter key
 * @param defaultValue - Default value when query parameter is not present
 * @param options - Navigation options (replace, scroll)
 *
 * @example
 * ```jsx
 * function MyComponent() {
 *   const [search, setSearch] = useQueryState("search", "");
 *   const [page, setPage] = useQueryState("page", "1");
 *   const [tab, setTab] = useQueryState("tab", "items");
 *
 *   // Get the query parameter value (typed)
 * // string
 *
 *   // Set the query parameter
 *   setSearch("hello");
 *
 *   // Remove the query parameter (set to null)
 *   setSearch(null);
 * }
 * ```
 */
export function useQueryState(
  key,
  defaultValue,
  options
){
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current value from URL or use default
  const value = (searchParams.get(key)) ?? defaultValue;

  /**
   * Set the query parameter value
   */
  const setValue = React.useCallback(
    (newValue) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newValue === null || newValue === undefined || newValue === "") {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      const opts = {
        replace: options?.replace ?? true,
        scroll: options?.scroll ?? false,
      };

      if (opts.replace) {
        router.replace(url, { scroll: opts.scroll });
      } else {
        router.push(url, { scroll: opts.scroll });
      }
    },
    [key, pathname, router, searchParams, options]
  );

  return [value, setValue];
}
"use client";

import { useEffect, useState } from "react";

import { normalizeBondNumber } from "../numberUtils";

const STORAGE_KEY = "prizeBondNumbers";

function sortEntries(entries) {
  return [...entries].sort((a, b) => a.number.localeCompare(b.number));
}

export default function usePrizeBondStore() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const normalized = Array.isArray(stored)
        ? stored
            .map((entry) => {
              const number = normalizeBondNumber(entry?.number);
              return number ? { ...entry, number } : null;
            })
            .filter(Boolean)
        : [];
      setEntries(sortEntries(normalized));
    } catch {
      setEntries([]);
    }
  }, []);

  const persist = (nextEntries) => {
    const sorted = sortEntries(nextEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    return sorted;
  };

  const addNumber = (value) => {
    const number = normalizeBondNumber(value);
    if (!number) return "invalid";
    if (entries.some((entry) => entry.number === number)) return "duplicate";

    setEntries((current) =>
      persist([...current, { number, timestamp: new Date().toISOString() }]),
    );
    return "added";
  };

  const updateNumber = (currentNumber, nextValue) => {
    const number = normalizeBondNumber(nextValue);
    if (!number) return "invalid";
    if (
      entries.some(
        (entry) => entry.number === number && entry.number !== currentNumber,
      )
    ) {
      return "duplicate";
    }

    setEntries((current) =>
      persist(
        current.map((entry) =>
          entry.number === currentNumber ? { ...entry, number } : entry,
        ),
      ),
    );
    return "updated";
  };

  const removeNumber = (number) => {
    setEntries((current) =>
      persist(current.filter((entry) => entry.number !== number)),
    );
  };

  const clearNumbers = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const tidyNumbers = () => {
    let removedCount = 0;
    const unique = new Map();
    entries.forEach((entry) => {
      const number = normalizeBondNumber(entry.number);
      if (!number || unique.has(number)) {
        removedCount += 1;
        return;
      }
      unique.set(number, { ...entry, number });
    });
    setEntries(persist([...unique.values()]));
    return removedCount;
  };

  const importNumbers = (values) => {
    const existing = new Set(entries.map((entry) => entry.number));
    const additions = [];

    values.forEach((value) => {
      const number = normalizeBondNumber(value);
      if (!number || existing.has(number)) return;
      existing.add(number);
      additions.push({ number, timestamp: new Date().toISOString() });
    });

    if (additions.length) {
      setEntries((current) => persist([...current, ...additions]));
    }
    return additions.length;
  };

  return {
    entries,
    addNumber,
    updateNumber,
    removeNumber,
    clearNumbers,
    tidyNumbers,
    importNumbers,
  };
}

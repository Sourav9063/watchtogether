"use client";

import { formatCount } from "../numberUtils";
import ActionGrid from "./ActionGrid";
import PrizeBondFooter from "./PrizeBondFooter";
import PrizeBondHero from "./PrizeBondHero";
import { css } from "./styles";
import usePrizeBondStore from "./usePrizeBondStore";

export default function PrizeBondApp() {
  const store = usePrizeBondStore();

  return (
    <main className={css("pb-page")} lang="bn">
      <div className={css("pb-certificate")}>
        <PrizeBondHero count={formatCount(store.entries.length)} />
        <ActionGrid />
        <PrizeBondFooter />
      </div>
    </main>
  );
}

import { Suspense } from "react";
import TmdbBrowseClient from "./TmdbBrowseClient";
import { getBrowseInitialDataAction } from "@/action/tmdb-browse";
import { actionData } from "@/lib/create-action";
import styles from "./TmdbBrowse.module.css";

const EMPTY_INITIAL_DATA = {
  genres: { movie: [], tv: [] },
  initialMediaByKey: {},
};

function TmdbBrowseFallback() {
  return (
    <div className={styles.browse}>
      <p className={styles.status}>Loading...</p>
    </div>
  );
}

export default function TmdbBrowse() {
  // Streamed to the client; a failed action degrades to empty sections.
  const initialDataPromise = actionData(
    getBrowseInitialDataAction(),
    EMPTY_INITIAL_DATA,
  );

  return (
    <Suspense fallback={<TmdbBrowseFallback />}>
      <TmdbBrowseClient initialDataPromise={initialDataPromise} />
    </Suspense>
  );
}

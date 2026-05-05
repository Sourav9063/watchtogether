import { Suspense } from "react";
import TmdbBrowseClient from "./TmdbBrowseClient";
import { getTmdbBrowseInitialData } from "./tmdbBrowseData";
import styles from "./TmdbBrowse.module.css";

function TmdbBrowseFallback() {
  return (
    <div className={styles.browse}>
      <p className={styles.status}>Loading...</p>
    </div>
  );
}

export default function TmdbBrowse() {
  const initialDataPromise = getTmdbBrowseInitialData();

  return (
    <Suspense fallback={<TmdbBrowseFallback />}>
      <TmdbBrowseClient initialDataPromise={initialDataPromise} />
    </Suspense>
  );
}

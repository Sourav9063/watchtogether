import styles from "./LatestMedia.module.css";
import config from "@/config";
import LatestMediaClient from "./LatestMediaClient";
import { randomRGBA } from "@/helper/customFunc";

// export const LatestType = {
//   MOVIE_NEW: "/movie/new",
//   MOVIE_ADD: "/movie/add",
//   TV_NEW: "/tv/new",
//   TV_ADD: "/tv/add",
// };
export const LatestType = {
  MOVIE_ADD: "/movies/latest/page-",
  TV_ADD: "/tvshows/latest/page-",
};

const fetchFn = async (url, option = {}) => {
  const res = await fetch(url, {
    next: { revalidate: 21600 },
    ...option,
  });
  if (!res.ok) {
    return {};
  }
  const data = await res.json();
  return data;
};

export async function getLatest({
  type = LatestType.MOVIE_ADD,
  numberOfPage = 2,
}) {
  const requests = Array.from({ length: numberOfPage }, (_, i) => {
    const url = config.latestMediaUrl1 + `${type}${i + 1}.json`;
    return fetchFn(url);
  });
  const results = await Promise.all(requests);
  const resultsArray = results.reduce((acc, cur) => {
    if (cur?.result) {
      return [...acc, ...cur.result];
    }
    return acc;
  }, []);
  const dataType = type === LatestType.MOVIE_ADD ? "movie" : "tv";
  const tmdbDetailsUrls = resultsArray.map((item) => {
    const { tmdb_id, imdb_id } = item;
    const id = tmdb_id || imdb_id;
    if (!id) return null;
    return `https://api.themoviedb.org/3/${dataType}/${id}?api_key=${config.tmdbApiKey}`;
  });
  const tmdbDetails = await Promise.all(
    tmdbDetailsUrls.map((url) => {
      if (!url) return null;
      return fetchFn(url);
    })
  );
  const tmdbDetailsMap = tmdbDetails.reduce((acc, cur) => {
    if (!cur) return acc;
    return { ...acc, [cur.id]: cur };
  }, {});
  return {
    data: resultsArray.map((item, i) => {
      const { tmdb_id, imdb_id, type, title } = item;
      const details = tmdbDetailsMap[tmdb_id];
      return {
        ...item,
        ...details,
        type: dataType,
        id: tmdb_id || imdb_id,
        title: title || details?.title,
        poster_image_url: details?.poster_path
          ? `https://image.tmdb.org/t/p/w500${details?.poster_path}`
          : null,
        backdrop_image_url: details?.backdrop_path
          ? `https://image.tmdb.org/t/p/w500${details?.backdrop_path}`
          : null,
      };
    }),
  };
}
export default async function LatestMedia({
  type = LatestType.MOVIE_ADD,
  numberOfPage = 2,
}) {
  const { data, error } = await getLatest({ type, numberOfPage });
  const header = {
    [LatestType.MOVIE_ADD]: "Latest Released Movies",
    [LatestType.MOVIE_ADD]: "Latest Added Movies",
    [LatestType.TV_ADD]: "Latest Released Series",
    [LatestType.TV_ADD]: "Latest Added Series",
  };
  return (
    <section className={styles["section"]}>
      <h1 className={styles["header"]}>{header[type]}</h1>
      <LatestMediaClient data={data} type={type} />
    </section>
  );
}

import styles from "./LatestMedia.module.css";
import config from "@/config";
import LatestMediaClient from "./LatestMediaClient";

export const LatestType = {
  MOVIE_NEW: "/movie/new",
  MOVIE_ADD: "/movie/add",
  TV_NEW: "/tv/new",
  TV_ADD: "/tv/add",
};

const fetchFn = async (url, option = {}) => {
  const res = await fetch(url, {
    next: { revalidate: 24 * 60 * 60 },
    ...option,
  });
  const data = await res.json();
  return data;
};

export async function getLatest({
  type = LatestType.MOVIE_NEW,
  numberOfPage = 7,
}) {
  const requests = Array.from({ length: numberOfPage }, (_, i) => {
    return fetchFn(`https://vidsrc.to/vapi${type}/${i + 1}`);
  });

  const results = await Promise.all(requests);

  const resultsArray = results.reduce(
    (acc, cur) => [...acc, ...cur.result.items],
    []
  );

  const tmdbDetailsUrls = resultsArray.map((item) => {
    const { tmdb_id: id, type } = item;
    if (!id) return null;
    return `https://api.themoviedb.org/3/${type}/${id}?api_key=${config.tmdbApiKey}`;
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
      const { tmdb_id: id, type, title } = item;
      const details = tmdbDetailsMap[id];
      return {
        ...item,
        ...details,
        title: title || details?.title,
        poster_image_url: `https://image.tmdb.org/t/p/w500${details?.poster_path}`,
        backdrop_image_url: `https://image.tmdb.org/t/p/w500${details?.backdrop_path}`,
      };
    }),
  };
}

export default async function LatestMedia({
  type = LatestType.MOVIE_NEW,
  numberOfPage = 5,
}) {
  const { data, error } = await getLatest({ type, numberOfPage });
  return (
    <section className={styles["section"]}>
      <h1 className={styles["header"]}>
        {type === LatestType.MOVIE_NEW || type === LatestType.MOVIE_ADD
          ? "Latest Movies"
          : "Latest Series"}
      </h1>
      <LatestMediaClient data={data} />
    </section>
  );
}

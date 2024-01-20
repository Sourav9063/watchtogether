import {
  useQuery,
  useSearchResults,
} from "@/components/Provider/IframeDataProvider";
import config from "@/config";
import { useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";

export const useTmdbSearch = () => {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [, setSearchResults] = useSearchResults();
  const [query] = useQuery();
  const debounce = useDebounce(query, 1500);
  useEffect(() => {
    setStatus("loading");
    if (!query) {
      setStatus("idle");
    }
  }, [query]);
  useEffect(() => {
    if (debounce) {
      const fn = async () => {
        try {
          const [movieRes, tvRes] = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/search/movie?api_key=${config.personal.tmdbApiKey}&query=${debounce}`
            ),
            fetch(
              `https://api.themoviedb.org/3/search/tv?api_key=${config.personal.tmdbApiKey}&query=${debounce}`
            ),
          ]);
          const [movieData, tvData] = await Promise.all([
            movieRes.json(),
            tvRes.json(),
          ]);
          for (const result of movieData.results) {
            result.type = "movie";
            result.title =
              result.title ||
              result.name ||
              result.original_title ||
              result.original_name;
            result.poster_image_url = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
            result.backdrop_image_url = `https://image.tmdb.org/t/p/w500${result.backdrop_path}`;
          }
          for (const result of tvData.results) {
            result.type = "tv";
            result.title =
              result.title ||
              result.name ||
              result.original_title ||
              result.original_name;
            result.poster_image_url = `https://image.tmdb.org/t/p/w500${result.poster_path}`;
            result.backdrop_image_url = `https://image.tmdb.org/t/p/w500${result.backdrop_path}`;
          }
          const combinedResults = [];
          for (
            let i = 0;
            i <
            Math.max(
              movieData.results?.length || 0,
              tvData.results?.length || 0
            );
            i++
          ) {
            if (tvData.results[i]) {
              combinedResults.push(tvData.results[i]);
            }
            if (movieData.results[i]) {
              combinedResults.push(movieData.results[i]);
            }
          }
          setSearchResults(combinedResults);
          setStatus("success");
        } catch (err) {
          console.log(err);
          setStatus("error");
        }
      };
      fn();
    }
  }, [debounce, setSearchResults]);
  return status;
};

// export const useTmdbDetails = ({ type = "tv", id }) => {
//   const [details, setDetails] = useState(null);
//   useEffect(() => {
//     fetch(
//       `https://api.themoviedb.org/3/${type}/${id}?api_key=${config.personal.tmdbApiKey}`
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         console.log(data);
//         setDetails(data);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }, [id, type]);
//   return details;
// };

// export const useTmdbGetSeasonsEpisodes = ({ type = "tv", id, season }) => {
//   const [seasonsEpisodes, setSeasonsEpisodes] = useState(null);
//   useEffect(() => {
//     fetch(
//       `https://api.themoviedb.org/3/${type}/${id}/season/${season}?api_key=${config.personal.tmdbApiKey}`
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         console.log(data);
//         setSeasonsEpisodes(data);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }, [id, type, season]);
//   return seasonsEpisodes;
// };

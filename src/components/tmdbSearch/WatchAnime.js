import React, { useState, useCallback, useEffect } from "react";
import styles from "./tmdbSearch.module.css";
import { useStore } from "@/helper/hooks/useStore";
import { Constants, Stores } from "@/helper/CONSTANTS";
import { useDebounce } from "@/helper/hooks/useDebounce";
`query($page:Int = 1 $id:Int $type:MediaType $isAdult:Boolean = false $search:String $format:[MediaFormat]$status:MediaStatus $countryOfOrigin:CountryCode $source:MediaSource $season:MediaSeason $seasonYear:Int $year:String $onList:Boolean $yearLesser:FuzzyDateInt $yearGreater:FuzzyDateInt $episodeLesser:Int $episodeGreater:Int $durationLesser:Int $durationGreater:Int $chapterLesser:Int $chapterGreater:Int $volumeLesser:Int $volumeGreater:Int $licensedBy:[Int]$isLicensed:Boolean $genres:[String]$excludedGenres:[String]$tags:[String]$excludedTags:[String]$minimumTagRank:Int $sort:[MediaSort]=[POPULARITY_DESC,SCORE_DESC]){Page(page:$page,perPage:20){pageInfo{total perPage currentPage lastPage hasNextPage}media(id:$id type:$type season:$season format_in:$format status:$status countryOfOrigin:$countryOfOrigin source:$source search:$search onList:$onList seasonYear:$seasonYear startDate_like:$year startDate_lesser:$yearLesser startDate_greater:$yearGreater episodes_lesser:$episodeLesser episodes_greater:$episodeGreater duration_lesser:$durationLesser duration_greater:$durationGreater chapters_lesser:$chapterLesser chapters_greater:$chapterGreater volumes_lesser:$volumeLesser volumes_greater:$volumeGreater licensedById_in:$licensedBy isLicensed:$isLicensed genre_in:$genres genre_not_in:$excludedGenres tag_in:$tags tag_not_in:$excludedTags minimumTagRank:$minimumTagRank sort:$sort isAdult:$isAdult){id title{userPreferred english romaji native}coverImage{extraLarge large color}startDate{year month day}endDate{year month day}bannerImage season seasonYear description type format status(version:2)episodes duration chapters volumes genres isAdult averageScore popularity nextAiringEpisode{airingAt timeUntilAiring episode}mediaListEntry{id status}studios(isMain:true){edges{isMain node{id name}}}}}}`;
const query = `query($page:Int = 1 $id:Int $type:MediaType=ANIME $isAdult:Boolean = false $search:String $format:[MediaFormat]$status:MediaStatus $countryOfOrigin:CountryCode $source:MediaSource $season:MediaSeason $seasonYear:Int $year:String $onList:Boolean $yearLesser:FuzzyDateInt $yearGreater:FuzzyDateInt $episodeLesser:Int $episodeGreater:Int $durationLesser:Int $durationGreater:Int $chapterLesser:Int $chapterGreater:Int $volumeLesser:Int $volumeGreater:Int $licensedBy:[Int]$isLicensed:Boolean $genres:[String]$excludedGenres:[String]$tags:[String]$excludedTags:[String]$minimumTagRank:Int $sort:[MediaSort]=[POPULARITY_DESC,SCORE_DESC]){Page(page:$page,perPage:20){pageInfo{total perPage currentPage lastPage hasNextPage}media(id:$id type:$type season:$season format_in:$format status:$status countryOfOrigin:$countryOfOrigin source:$source search:$search onList:$onList seasonYear:$seasonYear startDate_like:$year startDate_lesser:$yearLesser startDate_greater:$yearGreater episodes_lesser:$episodeLesser episodes_greater:$episodeGreater duration_lesser:$durationLesser duration_greater:$durationGreater chapters_lesser:$chapterLesser chapters_greater:$chapterGreater volumes_lesser:$volumeLesser volumes_greater:$volumeGreater licensedById_in:$licensedBy isLicensed:$isLicensed genre_in:$genres genre_not_in:$excludedGenres tag_in:$tags tag_not_in:$excludedTags minimumTagRank:$minimumTagRank sort:$sort isAdult:$isAdult){id title{userPreferred english romaji native}coverImage{extraLarge large color}startDate{year month day}endDate{year month day}bannerImage season seasonYear description type format status(version:2)episodes duration chapters volumes genres isAdult averageScore popularity nextAiringEpisode{airingAt timeUntilAiring episode}mediaListEntry{id status}studios(isMain:true){edges{isMain node{id name}}}}}}`;
const mapToTmdbData = (data) => {
  return {
    type: "anime",
    id: data.id,
    title:
      data.title.english ||
      data.title.userPreferred ||
      data.title.romaji ||
      data.title.native,
    poster_image_url: data.coverImage.large || data.coverImage.extraLarge,
    backdrop_image_url: data.coverImage.large || data.coverImage.extraLarge,
    description: data.description,
  };
};

export const searchAnime = async (search) => {
  try {
    let variables = {
      search: search,

      page: 1,

      perPage: 15,
    };

    const url = "https://graphql.anilist.co",
      options = {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          query: query,

          variables: variables,
        }),
      };

    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error("something went wrong");
    }

    const result = await res.json();

    return {
      data: result.data.Page.media.map(mapToTmdbData),
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};
export function WatchAnime() {
  const [showInput, setShowInput] = useState(false);

  const [btnTxt, setBtnTxt] = useState("Copy       History");

  const autoFocusFn = useCallback(
    (element) => (element ? element.focus() : null),

    []
  );

  const [searchResults, setSearchResults] = useStore(Stores.searchResults);

  const [search, setSearch] = useState();

  const debounce = useDebounce(search);

  useEffect(() => {
    async function fetchData() {
      if (!debounce || debounce === "") {
        return;
      }

      const res = await searchAnime(debounce);

      console.log(res);

      setSearchResults({
        type: "SEARCH",
        value: res?.data || [],
      });
    }

    fetchData();
  }, [debounce]);

  return (
    <div
      className={` 
      ${styles["paste"]} 
      `}
    >
      <h1
        className={`${styles["drop-down"]} 
      `}
        onClick={() => setShowInput((state) => !state)}
      >
        Watch Anime
        <span
          className={`${styles["arrow"]} 
      ${showInput ? styles["open"] : ""} 
      `}
        ></span>
      </h1>

      {showInput && (
        <div>
          <input
            type="text"
            placeholder="Anime Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div>
            <input type="number" />
            <div>
              <label htmlFor="dub">Dub</label>
              <input id="dub" type="checkbox" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

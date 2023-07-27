"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";
import ReactPlayer from "react-player";
import CustomLink from "../customButtons/CustomLink";
import { useSearchParams } from "next/navigation";
import { isURL } from "@/helper/customFunc";

export default function ReactVideoPlayer() {
  const videoPlayerRef = useRef(null);
  const searchParams = useSearchParams();
  //http://localhost:3000/?room=2nj1S&name=https://www.youtube.com/watch?v=1z_Chhbl1-g&duration=1073
  // console.log(searchParams.get("room"));
  // console.log(searchParams.get("name"));
  // console.log(searchParams.get("duration"));

  const [src, setSrc] = useState(
    isURL(searchParams.get("name")) ? searchParams.get("name") : null
  );
  const [link, setLink] = useState(isURL(searchParams.get("name")) ? "" : null);
  const [seekCalled, setSeekCalled] = useState(false);
  const handleChange = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    videoPlayerRef.current.name = file.name;
    console.log("first");
    setSrc(url);
  };
  const playEvent = () => {
    console.log("play" + videoPlayerRef.current.getCurrentTime());
  };
  const pauseEvent = () => {
    console.log("pause" + videoPlayerRef.current.getCurrentTime());
  };
  const seekEvent = (event) => {
    console.log("seek" + event);
  };

  useEffect(() => {
    setSeekCalled(false);
    return () => {};
  }, [src]);

  useEffect(() => {
    console.log(videoPlayerRef.current);
    videoPlayerRef.current.name = isURL(searchParams.get("name"))
      ? searchParams.get("name")
      : null;
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      if (
        videoPlayerRef.current.name &&
        videoPlayerRef.current.getCurrentTime()
      ) {
        localStorage.setItem(
          videoPlayerRef.current.name,
          videoPlayerRef.current.getCurrentTime()
        );
      }
      return (e.returnValue = "Are you sure you want to close?");
    });
    return () => {};
  }, [videoPlayerRef]);

  return (
    <div className={styles["video-wrapper"]}>
      {videoPlayerRef.current?.name && (
        <CustomLink
          name={videoPlayerRef.current.name}
          duration={videoPlayerRef.current.getDuration()}
        />
      )}
      <h1>Share Play</h1>
      <form action="">
        <input
          className={styles["input-link"]}
          type="text"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
          }}
        />
        <input
          type="submit"
          className={styles["link-submit"]}
          onClick={(e) => {
            e.preventDefault();
            if (link) {
              videoPlayerRef.current.name = link;
              setSrc(link);
            }
          }}
        />
      </form>

      <h3>Or</h3>
      <input
        type="file"
        accept="video/* .mkv .mp4 .webm .ogv"
        onInput={handleChange}
        placeholder="Select Video"
      />

      {/* <input
        type="file"
        accept="text/vtt .vtt .srt"
        onChange={handleSubtitle}
      /> */}
      <div className={styles["title"]}>
        {videoPlayerRef.current?.name || ""}
      </div>
      <div className={styles["video-wrapper"]}>
        <ReactPlayer
          width={"100%"}
          height={"70vh"}
          className={styles["video-player"]}
          ref={videoPlayerRef}
          url={src}
          controls
          playing={true}
          light={true}
          onReady={(player) => {
            if (!seekCalled) {
              player.seekTo(
                localStorage.getItem(videoPlayerRef.current.name) || 0
              );
              setSeekCalled(true);
            }
          }}
          onPlay={playEvent}
          onPause={pauseEvent}
          onSeek={seekEvent}
          onBuffer={(e) => {
            pauseEvent();
          }}
        ></ReactPlayer>
      </div>
    </div>
  );
}

{
  /* <input
type="file"
accept="video/* .mkv .mp4 .webm .ogv"
onChange={handleChange}
/>
<video ref={videoPlayerRef} controls autoPlay>
<track></track>
</video> */
}

// localStorage.setItem("lastPlayed", JSON.stringify({ src: url }));
// console.log(file);

// useEffect(() => {
//   let ref;
//   if (videoPlayerRef.current) {
//     ref = videoPlayerRef.current;
//     const lastPlayed = JSON.parse(localStorage.getItem("lastPlayed"));
//     if (lastPlayed) {
//       videoPlayerRef.current.src = lastPlayed.src;
//       // videoPlayerRef.current.currentTime = lastPlayed?.currentTime || 0;
//     }
//   }

//   return () => {
//     console.log(ref);
//     console.log(ref.src);
//     console.log(ref.currentTime);
//     localStorage.setItem(
//       "lastPlayed",
//       JSON.stringify({
//         src: ref.src,
//         currentTime: ref.currentTime,
//       })
//     );
//   };
// }, [videoPlayerRef]);

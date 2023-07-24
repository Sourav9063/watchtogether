"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

export default function VideoPlayer() {
  const videoPlayerRef = useRef(null);
  const subtitleRef = useRef(null);
  const [src, setSrc] = useState(null);
  const handleChange = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    setSrc(file.name);
    videoPlayerRef.current.src = url;
  };
  const handleSubtitle = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    subtitleRef.current.src = url;
    videoPlayerRef.current.textTracks[0].mode = "showing";
    videoPlayerRef.current.textTracks[0].src = url;
  };
  const playEvent = (event) => {
    console.log(event);
  };
  const pauseEvent = (event) => {
    console.log(event.timeStamp);
    console.log(videoPlayerRef.current.currentTime);
  };
  const timeUpdateEvent = (event) => {
    console.log(event);
  };
  const seekEvent = (event) => {
    console.log(event);
    console.log(videoPlayerRef.current.currentTime);
  };

  useEffect(() => {
    if (videoPlayerRef.current) {
      //play pause
      videoPlayerRef.current.addEventListener("play", playEvent);
      videoPlayerRef.current.addEventListener("pause", pauseEvent);
      //time update
      // videoPlayerRef.current.addEventListener("timeupdate", timeUpdateEvent);
      //seek event
      videoPlayerRef.current.addEventListener("seeking", seekEvent);
    }
  }, [videoPlayerRef]);

  return (
    <>
      <input
        type="file"
        accept="video/* .mkv .mp4 .webm .ogv"
        onChange={handleChange}
      />
      <input
        type="file"
        accept="text/vtt .vtt .srt"
        onChange={handleSubtitle}
      />
      <div>{src}</div>
      <video
        className={styles["video-player"]}
        ref={videoPlayerRef}
        controls
        autoPlay
      >
        <track
          ref={subtitleRef}
          kind="subtitles"
          srcLang="en"
          label="English"
        />
      </video>
    </>
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

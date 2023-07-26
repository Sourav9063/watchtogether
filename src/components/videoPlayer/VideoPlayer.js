"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

export default function VideoPlayer() {
  const videoPlayerRef = useRef(null);
  const subtitleRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [link, setLink] = useState(null);
  const handleChange = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    console.log("called");
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
      console.log(videoPlayerRef.current.textTracks);
      videoPlayerRef.current.textTracks[0].mode = "showing";
      console.log(videoPlayerRef.current.audioTracks);
      videoPlayerRef.current.addEventListener("play", playEvent);
      videoPlayerRef.current.addEventListener("pause", pauseEvent);
      videoPlayerRef.current.addEventListener("seeking", seekEvent);
    }
    return () => {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.removeEventListener("play", playEvent);
        videoPlayerRef.current.removeEventListener("pause", pauseEvent);
        videoPlayerRef.current.removeEventListener("seeking", seekEvent);
      }
    };
  }, [videoPlayerRef]);

  useEffect(() => {
    if (src) {
      videoPlayerRef.current.currentTime = localStorage.getItem(src) || 0;
      window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        localStorage.setItem(src, videoPlayerRef.current.currentTime);
        return (e.returnValue = "Are you sure you want to close?");
      });
    }
    return () => {};
  }, [src]);

  return (
    <div className={styles["video-wrapper"]}>
      <h1>Video Player</h1>
      <form action="">
        <input
          type="text"
          onChange={(e) => {
            console.log(e.target.value);
            setLink(e.target.value);
            setSrc(e.target.value);
          }}
        />
        <input
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            console.log(src);
            videoPlayerRef.current.src = link;
          }}
        />
      </form>
      <h3>Or</h3>
      <input
        type="file"
        accept="video/* .mkv .mp4 .webm .ogv"
        onChange={handleChange}
        placeholder="Select Video"
      />
      {/* <input
        type="file"
        accept="text/vtt .vtt .srt"
        onChange={handleSubtitle}
      /> */}
      <div>{src}</div>
      {videoPlayerRef.current?.audioTracks?.map((track, index) => {
        return <div key={index}>{index}</div>;
      })}
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

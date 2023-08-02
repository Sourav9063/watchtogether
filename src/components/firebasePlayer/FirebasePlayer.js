"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "../reactPlayer/VideoPlayer.module.css";
import ReactPlayer from "react-player";
import CustomLink from "../customButtons/CustomLink";
import { useSearchParams } from "next/navigation";
import { getCustomLink, isURL, secondsToHMS } from "@/helper/customFunc";
import { db, getRoomRef, setRoom, setRoomAction } from "@/db/dbConnection";
import { onValue, ref } from "firebase/database";
import { Constants } from "@/helper/CONSTANTS";
import { toast } from "react-toastify";
import MessageBox from "../message/MessageBox";

let controlBySocket = false;
export default function FirebaseVideoPlayer() {
  const videoPlayerRef = useRef(null);
  const searchParams = useSearchParams();
  const [action, setAction] = useState(null);
  const [time, setTime] = useState(null);

  const [src, setSrc] = useState(
    isURL(searchParams.get("name")) ? searchParams.get("name") : ""
  );
  const [play, setPlay] = useState(true);
  const [link, setLink] = useState(isURL(searchParams.get("name")) ? "" : "");
  const [seekCalled, setSeekCalled] = useState(false);
  const handleChange = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    videoPlayerRef.current.name = file.name;
    console.log("first");
    setSrc(url);
  };
  const playEvent = async () => {
    console.log("play");
    console.log(controlBySocket + getCustomLink());

    if (controlBySocket) {
      controlBySocket = false;
      return;
    }

    console.log("play called");
    await setRoomAction(searchParams.get("room") || getCustomLink(), {
      type: Constants.playerActions.PLAY,
      time: videoPlayerRef.current.getCurrentTime(),
      by: getCustomLink(),
    });
  };
  const pauseEvent = async () => {
    console.log("pause");
    console.log(controlBySocket + getCustomLink());

    if (controlBySocket) {
      controlBySocket = false;
      return;
    }
    console.log("pause called");
    await setRoomAction(searchParams.get("room") || getCustomLink(), {
      type: Constants.playerActions.PAUSE,
      time: videoPlayerRef.current.getCurrentTime(),
      by: getCustomLink(),
    });
  };
  const seekEvent = async (event) => {
    setPlay(false);
    console.log(controlBySocket + " ");
    console.log("seek" + event);

    if (controlBySocket) {
      controlBySocket = false;
      return;
    }
    await setRoomAction(searchParams.get("room") || getCustomLink(), {
      type: Constants.playerActions.SEEK,
      time: videoPlayerRef.current.getCurrentTime(),
      by: getCustomLink(),
    });
  };

  useEffect(() => {
    console.log("useEffect");
    setSeekCalled(false);
    setRoom(searchParams.get("room") || getCustomLink(), {
      roomId: searchParams.get("room") || getCustomLink(),
      url: src,
      duration: videoPlayerRef.current.getDuration(),
      currentTime: videoPlayerRef.current.getCurrentTime(),
    });
    return () => {};
  }, [src]);

  useEffect(() => {
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
  }, [videoPlayerRef, searchParams]);

  useEffect(() => {
    const roomId = searchParams.get("room") || getCustomLink();
    // const query = ref(db, "rooms/" + roomId);
    // onValue(query, (snapshot) => {
    //   const data = snapshot.val();
    //   if (snapshot.exists()) {
    //     setSrc(data.url);
    //   }
    // });
    const playerAction = ref(db, "actions/" + roomId);
    return onValue(playerAction, (snapshot) => {
      const data = snapshot.val();
      if (snapshot.exists()) {
        if (data.by === getCustomLink()) {
          return;
        }
        toast(`${data.type} by Someone at ${secondsToHMS(data.time)}`);
        controlBySocket = true;
        switch (data.type) {
          case Constants.playerActions.PLAY:
            videoPlayerRef.current.seekTo(data.time);
            setPlay(true);
            break;
          case Constants.playerActions.PAUSE:
            setPlay(false);
            break;

          default:
            break;
        }
      }
    });
  }, []);

  return (
    <>
      <section>
        {videoPlayerRef.current?.name && !searchParams.get("room") && (
          <CustomLink
            name={videoPlayerRef.current.name}
            duration={videoPlayerRef.current.getDuration()}
            currentTime={videoPlayerRef.current.getCurrentTime()}
          />
        )}
        <div className={styles["control-wrapper"]}>
          <form action="">
            <h2>Choose Source</h2>
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
                console.log(link);
                console.log(isURL(link));
                if (link && isURL(link)) {
                  videoPlayerRef.current.name = link;
                  setSrc(link);
                }
              }}
            />
            <h3>Or</h3>
            <input
              type="file"
              accept="video/* .mkv .mp4 .webm .ogv"
              onInput={handleChange}
              placeholder="Select Video"
            />
          </form>
          <MessageBox />
        </div>
      </section>

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
          height={"100%"}
          className={styles["video-player"]}
          ref={videoPlayerRef}
          url={src}
          controls
          playing={play}
          onReady={(player) => {
            controlBySocket = false;
            if (!seekCalled) {
              player.seekTo(
                localStorage.getItem(videoPlayerRef.current.name) || 0
              );
              setSeekCalled(true);
            }
          }}
          onPlay={playEvent}
          onPause={pauseEvent}
          // onSeek={seekEvent}
          onBufferEnd={(e) => {
            setPlay(true);
          }}
        ></ReactPlayer>
      </div>
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

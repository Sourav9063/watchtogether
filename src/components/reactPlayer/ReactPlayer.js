"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";
import ReactPlayer from "react-player";
import CustomLink from "../customButtons/CustomLink";
import { useSearchParams } from "next/navigation";
import { getCustomLink, isURL } from "@/helper/customFunc";
import { io } from "socket.io-client";
import { Constants } from "@/helper/CONSTANTS";
let socket;
export { socket };
let controlBySocket = false;
export default function ReactVideoPlayer() {
  const videoPlayerRef = useRef(null);
  const searchParams = useSearchParams();
  const [action, setAction] = useState(null);
  const [time, setTime] = useState(null);
  //http://localhost:3000/?room=2nj1S&name=https://www.youtube.com/watch?v=1z_Chhbl1-g&duration=1073
  // console.log(searchParams.get("room"));
  // console.log(searchParams.get("name"));
  // console.log(searchParams.get("duration"));

  const [src, setSrc] = useState(
    isURL(searchParams.get("name")) ? searchParams.get("name") : ""
  );
  const [play, setPlay] = useState(true);
  const [link, setLink] = useState(isURL(searchParams.get("name")) ? "" : "");
  const [seekCalled, setSeekCalled] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const handleChange = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    videoPlayerRef.current.name = file.name;
    console.log("first");
    setSrc(url);
  };
  const playEvent = () => {
    console.log(controlBySocket + " " + socket?.id);

    console.log("play" + videoPlayerRef.current.getCurrentTime());
    if (controlBySocket) {
      // controlBySocket = false;
      return;
    }
    socket.emit(
      "playerControl",
      {
        type: Constants.playerActions.PLAY,
        time: videoPlayerRef.current.getCurrentTime(),
      },
      searchParams.get("room") || getCustomLink()
    );
  };
  const pauseEvent = () => {
    console.log(controlBySocket + " " + socket?.id);

    console.log("pause" + videoPlayerRef.current.getCurrentTime());
    if (controlBySocket) {
      // controlBySocket = false;
      return;
    }
    socket.emit(
      "playerControl",
      {
        type: Constants.playerActions.PAUSE,
        time: videoPlayerRef.current.getCurrentTime(),
      },
      searchParams.get("room") || getCustomLink()
    );
  };
  const seekEvent = (event) => {
    console.log(controlBySocket + " " + socket?.id);

    console.log("seek" + event);

    if (controlBySocket) {
      // controlBySocket = false;
      return;
    }
    socket.emit(
      "playerControl",
      {
        type: Constants.playerActions.SEEK,
        time: videoPlayerRef.current.getCurrentTime(),
      },
      searchParams.get("room") || getCustomLink()
    );
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
  }, [videoPlayerRef, searchParams]);

  const socketInitializer = async () => {
    // We call this just to make sure we turn on the websocket server
    await fetch("/api/socket");
    console.log("call");

    socket = io(undefined, {
      path: "/api/socket_io",
    });
    socket.on("connect", () => {
      console.log("Connected", socket.id);
      setSocketId(socket.id);
      socket.emit("joinRoom", searchParams.get("room") || getCustomLink());
    });

    socket.on("playerControl", (data) => {
      console.log(data);
      controlBySocket = true;
      setAction(data.type);
      setTime(data.time);
      console.log(controlBySocket);
      switch (data.type) {
        case Constants.playerActions.PLAY:
          videoPlayerRef.current?.seekTo(data.time);
          setPlay(true);
          break;
        case Constants.playerActions.PAUSE:
          setPlay(false);
          break;
        case Constants.playerActions.SEEK:
          videoPlayerRef.current?.seekTo(data.time);
          break;
        case Constants.playerActions.URLCHANGE:
          isURL(data.url) && setSrc(data.url);
          break;
        default:
          break;
      }
    });
  };

  const sendMessageHandler = async (e) => {
    if (!socket) return;
    const value = e.target.value;
    socket.emit("createdMessage", value);
  };

  useEffect(() => {
    try {
      socketInitializer();
    } catch (e) {
      console.log(e);
    }
  }, []);

  return (
    <div className={styles["video-wrapper"]}>
      <button
        onClick={() => {
          console.log(searchParams.get("room") || getCustomLink());
          try {
          } catch (e) {
            console.log(e);
          }
        }}
      >
        Click
      </button>
      {socketId && <div>{socketId}</div>}
      {action && <div>{action}</div>}
      {time && <div>{time}</div>}
      {videoPlayerRef.current?.name && socketId && (
        <CustomLink
          name={videoPlayerRef.current.name}
          socketId={socketId}
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
            if (link && isURL(link)) {
              videoPlayerRef.current.name = link;
              socket.emit(
                "playerControl",
                {
                  type: Constants.playerActions.URLCHANGE,
                  time: 0,
                  url: link,
                },
                searchParams.get("room") || getCustomLink()
              );
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

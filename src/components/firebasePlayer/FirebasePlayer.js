"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "../reactPlayer/VideoPlayer.module.css";
import ReactPlayer from "react-player";
import CustomLink from "../customButtons/CustomLink";
import styleMain from "@/app/page.module.css";
import { useSearchParams } from "next/navigation";
import {
  getCustomLink,
  isURL,
  randomRGBA,
  secondsToHMS,
} from "@/helper/customFunc";
import { db, setRoom, setRoomAction } from "@/db/dbConnection";
import { Constants } from "@/helper/CONSTANTS";
import { toast } from "react-toastify";
import MessageBox from "../message/MessageBox";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { default as toWebVTT } from "srt-webvtt";
// import sth from "./sth.vtt";

let controlBySocket = false;
export default function FirebaseVideoPlayer() {
  const videoPlayerRef = useRef(null);
  const searchParams = useSearchParams();
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
    urlChangeEvent(file.name);
    setSrc(url);
  };

  const handleSubChange = async (event) => {
    const file = event.target.files[0];
    const textTrackUrl = await toWebVTT(file);

    const track = document.querySelector("track");
    const video = document.querySelector("video");
    track.src = textTrackUrl;
    video.textTracks[0].mode = "show";
  };
  const playEvent = async () => {
    console.log("play");
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
  const pauseEvent = async (e) => {
    if (controlBySocket) {
      controlBySocket = false;
      return;
    }

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
  const urlChangeEvent = async (src) => {
    console.log("urlChange");
    await setRoom(searchParams.get("room") || getCustomLink(), {
      roomId: searchParams.get("room") || getCustomLink(),
      url: src,
      duration: videoPlayerRef.current.getDuration(),
      currentTime: videoPlayerRef.current.getCurrentTime(),
    });
    await setRoomAction(searchParams.get("room") || getCustomLink(), {
      type: Constants.playerActions.URLCHANGE,
      url: src,
      by: getCustomLink(),
      time: videoPlayerRef.current.getCurrentTime(),
    });
  };

  useEffect(() => {
    setSeekCalled(false);
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

    const playerAction = doc(db, "actions", roomId);
    const roomDoc = doc(db, "rooms", roomId);

    getDoc(roomDoc)
      .then((doc) => {
        if (doc.exists()) {
          const data = doc.data();

          if (!data.url || data.url === src) return;
          if (!isURL(data.url)) {
            toast.error(
              "Playing a local file named: " +
                data.url +
                " .Choose from your local files to play it.",
              {
                autoClose: 10000,
                className: styles["toast-pause"],
                progressStyle: {
                  background: "#ff0055",
                  height: "2px",
                },
              }
            );
          } else {
            toast.success("Playing " + data.url);
            setSrc(data.url);
            setLink(data.url);
            videoPlayerRef.current.seekTo(data.currentTime);
            setPlay(true);
          }
        }
      })
      .catch((error) => {
        console.log("Error getting document:", error);
      });

    const main = document.querySelector("." + styleMain.main);
    main.style.setProperty("--left-color", randomRGBA());
    main.style.setProperty("--right-color", randomRGBA());

    return onSnapshot(playerAction, (snapshot) => {
      const data = snapshot.data();
      if (!data || data.by === getCustomLink()) {
        return;
      }
      controlBySocket = true;
      const name = data.username ? data.username : data.by;
      switch (data.type) {
        case Constants.playerActions.PLAY:
          toast(
            `Played by ${name || "someone"} at ${secondsToHMS(data.time)}`,
            {
              className: styles["toast-play"],
              progressStyle: {
                background: "#00ffd9",
                height: "2px",
              },
            }
          );
          setPlay(true);
          videoPlayerRef.current.seekTo(data.time);
          break;
        case Constants.playerActions.PAUSE:
          toast(
            `Paused by  ${name || "someone"} at ${secondsToHMS(data.time)}`,
            {
              className: styles["toast-pause"],
              progressStyle: {
                background: "#ff0055",
                height: "2px",
              },
            }
          );
          setPlay(false);
          break;
        case Constants.playerActions.CHAT:
          toast(`${data.name} said "${data.message}"`, {
            autoClose: 10000,
            className: styles["toast-msg"],
            progressStyle: {
              background: "#9000ff",
              height: "2px",
            },
          });
          break;
        case Constants.playerActions.URLCHANGE:
          if (isURL(data.url)) {
            toast(`URL changed by ${name || "someone"} to "${data.url}"`);
            setSrc("");
            setSrc(data.url);
            setLink(data.url);
          } else {
            toast.error(
              "Playing a local file named: " +
                data.url +
                " .Choose the video from your storage.",
              {
                autoClose: 10000,
                className: styles["toast-pause"],
                progressStyle: {
                  background: "#ff0055",
                  height: "2px",
                },
              }
            );
          }
          break;
        default:
          break;
      }
    });
  }, []);

  return (
    <>
      <section>
        {(videoPlayerRef.current?.name || src) && (
          <CustomLink
            name={videoPlayerRef.current.name}
            duration={videoPlayerRef.current.getDuration()}
            currentTime={videoPlayerRef.current.getCurrentTime()}
          />
        )}
        <div className={styles["control-wrapper"]}>
          <form action="">
            <h3>Choose Source</h3>
            <div className={styles["all-input-wrapper"]}>
              <div className={`${styles["input-wrapper"]} input-wrapper `}>
                <div>Paste Video Link</div>
                <input
                  className={styles["input-link"]}
                  type="text"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                  }}
                />
                <button
                  type="submit"
                  className={styles["link-submit"]}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log(link);
                    console.log(isURL(link));
                    if (link && isURL(link)) {
                      videoPlayerRef.current.name = link;
                      setSrc(link);
                    } else {
                      toast.error("Please input correct URL", {
                        autoClose: 2000,
                        className: styles["toast-pause"],
                        progressStyle: {
                          background: "#ff0055",
                          height: "2px",
                        },
                      });
                    }
                  }}
                >
                  Set Video
                </button>
                <button
                  type="button"
                  className={styles["link-submit"]}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log(link);
                    console.log(isURL(link));
                    if (link && isURL(link)) {
                      videoPlayerRef.current.name = link;
                      setSrc(link);
                      urlChangeEvent(link);
                    } else {
                      toast.error("Please input correct URL", {
                        autoClose: 2000,
                        className: styles["toast-pause"],
                        progressStyle: {
                          background: "#ff0055",
                          height: "2px",
                        },
                      });
                    }
                  }}
                >
                  Sync URL
                </button>
                <p className={styles["notice"]}>
                  *Make sure the link is accessible by all.
                </p>
              </div>
              <div className={`${styles["input-wrapper"]} input-wrapper `}>
                <div>Or, Select Local Video</div>
                <input
                  type="file"
                  accept="'video/mp4,.mp4,
                  video/avi,.avi,
                  video/mpeg,.mpeg,.mpg,
                  video/3gpp,.3gp,.divx,
                  video/x-flv,.flv,
                  video/x-matroska,.mkv,
                  video/quicktime,.mov,
                  audio/ogg,.ogg,
                  video/webm,.webm,
                  video/x-ms-wmv,.wmv'"
                  onInput={handleChange}
                  placeholder="Select Video"
                />
                <div>Select Subtitle</div>
                <input
                  type="file"
                  accept="text/vtt .vtt .srt"
                  onInput={handleSubChange}
                  placeholder="Select Subtitle"
                />
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* <input
        type="file"
        accept="text/vtt .vtt .srt"
        onChange={handleSubtitle}
      /> */}
      <div className={styles["title"]}>
        {videoPlayerRef.current?.name || src || ""}
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
          // onSeek={(e) => {

          // }}
          onBufferEnd={(e) => {
            setPlay(true);
          }}
          config={{
            file: {
              attributes: {
                crossOrigin: "true",
              },
              tracks: [
                {
                  kind: "subtitles",
                  // src: "https://prod.fitflexapp.com/files/captions/2021/11/18/23-b2j0oOsJ.vtt",
                  src: "https://sourav9063.github.io/static-json/vtt/sth.vtt",
                  srcLang: "en",
                  default: true,
                  mode: "show",
                },
              ],
            },
          }}
        ></ReactPlayer>
      </div>
      <MessageBox />
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

// useEffect(() => {
//   const roomId = searchParams.get("room") || getCustomLink();
//   // const query = ref(db, "rooms/" + roomId);
//   // onValue(query, (snapshot) => {
//   //   const data = snapshot.val();
//   //   if (snapshot.exists()) {
//   //     setSrc(data.url);
//   //   }
//   // });
//   // const playerAction = ref(dbR, "actions/" + roomId);
//   // return onValue(playerAction, (snapshot) => {
//   //   const data = snapshot.val();
//   //   if (snapshot.exists()) {
//   //     if (data.by === getCustomLink()) {
//   //       return;
//   //     }

//   //     controlBySocket = true;
//   //     switch (data.type) {
//   //       case Constants.playerActions.PLAY:
//   //         toast(`${data.type} by Someone at ${secondsToHMS(data.time)}`);
//   //         videoPlayerRef.current.seekTo(data.time);
//   //         setPlay(true);
//   //         break;
//   //       case Constants.playerActions.PAUSE:
//   //         toast(`${data.type} by Someone at ${secondsToHMS(data.time)}`);
//   //         setPlay(false);
//   //         break;
//   //       case Constants.playerActions.CHAT:
//   //         toast(`${data.name} said "${data.message}"`, {
//   //           autoClose: 10000,
//   //         });
//   //         break;
//   //       case Constants.playerActions.URLCHANGE:
//   //         toast(`${data.type} by Someone to ${data.url}`);
//   //         setSrc(data.url);
//   //         videoPlayerRef.current.seekTo(0);
//   //         break;
//   //       default:
//   //         break;
//   //     }
//   //   }
//   // });
// }, []);

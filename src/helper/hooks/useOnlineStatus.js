import { useEffect, useState } from "react";
import useEventListener from "./useEventListener";
import { toast } from "react-toastify";
import styles from "../../components/reactPlayer/VideoPlayer.module.css";
export default function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    return () => {};
  }, []);

  useEventListener("online", () => {
    setOnline(navigator.onLine);

    toast(`You are connected!`, {
      position: "top-right",
      autoClose: false,
      className: styles["toast-play"],
      progressStyle: {
        background: "#00ffd9",
        height: "2px",
      },
    });
  });
  useEventListener("offline", () => {
    setOnline(navigator.onLine);

    toast.error("You are disconnected!", {
      position: "top-right",
      className: styles["toast-pause"],
      progressStyle: {
        background: "#ff0055",
        height: "2px",
      },
    });
  });

  return online;
}

import React from "react";
import styles from "./iframePlayer.module.css";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import config from "@/config";

export default function VideoSrc() {
  const [iframeUrl, setIframeUrl] = useIframeUrl();
  return (
    <div className={styles["src"]}>
      <p>
        {
          "*If current server doesn't work please try other servers. You can download from some server."
        }
      </p>
      <div className={`${styles["src-list"]} ${styles[""]} `}>
        {config.iframe.urls.map((url, index) => {
          return (
            <button
              key={index}
              style={{
                backgroundColor:
                  iframeUrl.baseUrl === url
                    ? " var(--hover-color)"
                    : "var(--primary-color)",
              }}
              onClick={() => {
                setIframeUrl((state) => {
                  return { ...state, baseUrl: url };
                });
              }}
            >
              Source {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
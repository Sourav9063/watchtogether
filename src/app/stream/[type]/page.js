"use client";

import config from "@/config";
import styles from "../../../components/iframePlayer/iframePlayer.module.css";
import FloatingNav from "@/components/stream/FloatingNav";

export default function Stream({ params }) {
  const { type } = params;
  const baseUrl = config.iframe.url15.split("/embed")[0];
  const src = `${baseUrl}/${type}`;

  return (
    <>
      <FloatingNav />
      <iframe
        allowFullScreen={true}
        className={`${styles["iframe"]} back-light `}
        style={{ width: "100%", minHeight: "100vh", margin: "0px" }}
        src={src}
      />
    </>
  );
}
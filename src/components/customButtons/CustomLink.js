"use client";
import React, { useState } from "react";
import style from "./CustomLink.module.css";
import { getCustomLink } from "@/helper/customFunc";
import { useSearchParams, useRouter } from "next/navigation";

export default function CustomLink({ name, duration, currentTime, className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState("Copy Joining Link");
  const classnames = `${style["button"]} ${className ? className : ""}`;
  return (
    <button
      className={classnames}
      onClick={() => {
        try {
          const roomId = searchParams.get("room") || getCustomLink();
          const link = window.location.origin + "/?room=" + roomId;
          navigator.clipboard.writeText(link);
          setText("Copied!");
          setTimeout(() => {
            setText("Copy Joining Link");
          }, 1500);
        } catch (e) {
          console.log(e);
        }
      }}
    >
      {text}
      <div className={style["arrow-wrapper"]}>
        <div className={style["arrow"]}></div>
      </div>
    </button>
  );
}

"use client";
import React, { useState } from "react";
import style from "./CustomLink.module.css";
import { getCustomLink } from "@/helper/customFunc";
import { useRouter } from "next/navigation";
import { getRoom, setRoom } from "@/db/dbConnection";

export default function CustomLink({ name, duration, currentTime, className }) {
  const [text, setText] = useState("Copy Joining Link");
  const classnames = `${style["button"]} ${className ? className : ""}`;
  return (
    <button
      className={classnames}
      onClick={() => {
        try {
          console.log(getCustomLink());
          // setRoom(getCustomLink(), {
          //   roomId: getCustomLink(),
          //   url: name,
          //   duration: duration,
          //   currentTime: currentTime,
          // });

          const link =
            window.location.href +
            "?room=" +
            getCustomLink() +
            "&name=" +
            name +
            "&duration=" +
            duration;
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

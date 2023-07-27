"use client";
import React, { useState } from "react";
import style from "./CustomLink.module.css";
import { getCustomLink } from "@/helper/customFunc";
import { useRouter } from "next/navigation";

export default function CustomLink({ name, duration, className }) {
  const [text, setText] = useState("Copy Joining Link");
  const classnames = `${style["button"]} ${className ? className : ""}`;
  return (
    <button
      className={classnames}
      onClick={() => {
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
      }}
    >
      {text}
      <div className={style["arrow-wrapper"]}>
        <div className={style["arrow"]}></div>
      </div>
    </button>
  );
}

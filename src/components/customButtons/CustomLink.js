"use client";
import React from "react";
import style from "./CustomLink.module.css";
import { getCustomLink } from "@/helper/customFunc";
import { useRouter } from "next/navigation";

export default function CustomLink() {
  const router = useRouter();
  return (
    <button
      className={style["button"]}
      onClick={() => {
        router.push(getCustomLink());
      }}
    >
      Create Link
      <div className={style["arrow-wrapper"]}>
        <div className={style["arrow"]}></div>
      </div>
    </button>
  );
}

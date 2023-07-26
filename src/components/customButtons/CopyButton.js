"use client";
import React, { useState } from "react";
import style from "./CustomLink.module.css";
export default function CustomLink({ className }) {
  const [buttonText, setButtonText] = useState("Copy Link");
  const classnames = `${style["button"]} ${className}`;
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Copy Link");
        }, 1000);
      }}
      className={classnames}
    >
      {buttonText}
    </button>
  );
}

"use client";
import React from "react";
import style from "./CustomLink.module.css";
export default function CustomLink({ text, onClick, className }) {
  const classnames = `${style["button"]} ${className}`;
  return (
    <button onClick={onClick} className={classnames}>
      {text}
    </button>
  );
}

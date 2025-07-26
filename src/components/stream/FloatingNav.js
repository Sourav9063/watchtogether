"use client";
import { useState } from "react";
import styles from "./FloatingNav.module.css";
import StreamNavigation from "@/components/stream/StreamNavigation";

export default function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`${styles.floatingNavContainer} ${
        isOpen ? styles.open : ""
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.indicator}
        onClick={toggleNav}
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      <div className={styles.navWrapper}>
        <StreamNavigation />
      </div>
    </div>
  );
}
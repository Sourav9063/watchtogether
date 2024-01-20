"use client";
import React, { useEffect } from "react";
import { useIframeUrl } from "../Provider/IframeDataProvider";
import { itrSeEp } from "@/helper/iframeFunc";

export default function IframeUseEffects() {
  const [iframeUrl, setIframeUrl] = useIframeUrl();
  useEffect(() => {
    const keyDown = (e) => {
      if (iframeUrl?.type == "movie") return;
      if (e.key == "ArrowLeft") {
        if (e.shiftKey) {
          setIframeUrl((state) => {
            return {
              ...state,
              ...itrSeEp({ state, itrSe: -1 }),
            };
          });
        }
        if (e.ctrlKey) {
          setIframeUrl((state) => {
            return {
              ...state,
              ...itrSeEp({ state, itrEp: -1 }),
            };
          });
        }
      }
      if (e.key == "ArrowRight") {
        console.log(itrSeEp({ state: iframeUrl, itrSe: 1 }));
        if (e.shiftKey) {
          setIframeUrl((state) => {
            return {
              ...state,
              ...itrSeEp({ state: state, itrSe: 1 }),
            };
          });
        }
        if (e.ctrlKey) {
          setIframeUrl((state) => {
            return {
              ...state,
              ...itrSeEp({ state: state, itrEp: 1 }),
            };
          });
        }
      }
    };

    window.addEventListener("keydown", keyDown);
    return () => {
      window.removeEventListener("keydown", keyDown);
    };
  }, [iframeUrl, setIframeUrl]);
  return <></>;
}

"use client"
import React from 'react'
import { ToastContainer } from "react-toastify";
export default function Toastify() {
  return (
    <div>
        <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        limit={6}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(0,123,167,0.4)",
          minHeight: "0px",
        }}
        closeButton={<Close />}
        bodyStyle={{}}
        progressStyle={{ height: "2px", backgroundColor: "rgb(0,123,167)" }}
          />
    </div>
  )
}
function Close() {
    return (
      <div>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_164_1668)">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M19.601 5.60101L5.60101 19.601L4.39893 18.3989L18.3989 4.39893L19.601 5.60101Z"
              fill="#ffffff"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M5.60101 4.39899L19.601 18.399L18.3989 19.6011L4.39893 5.60107L5.60101 4.39899Z"
              fill="#ffffff"
            />
          </g>
          <defs>
            <clipPath id="clip0_164_1668">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
    );
  }
  
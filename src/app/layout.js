import "./globals.css";
import { Inter } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });
import React from "react";
import Toastify from "@/components/common/Toastify";

export const metadata = {
  title: "Watch Together",
  description: "Simple website to play videos with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Toastify/>
      <body className={inter.className}>{children}</body>
    </html>
  );
}



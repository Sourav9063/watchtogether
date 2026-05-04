import "./globals.css";
import { Inter } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";

import React from "react";
import ToastProvider from "@/components/common/Toastify";

const inter = Inter({ subsets: ["latin"] });
export const metadata = {
  title: "Watch Together",
  description: "Simple website to play videos with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import "../globals.css";
export const metadata = {
  title: "Free Stream",
  description:
    "Simple website to play videos. Highly suggested to use an Ad blocker like uBlock, or Adblock.",
};

export default function BigTwoLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}

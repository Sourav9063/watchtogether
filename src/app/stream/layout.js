import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import "../globals.css";
export const metadata = {
  title: "Free Stream",
  description:
    "Simple website to play videos. Highly suggested to use an Ad blocker like uBlock, or Adblock.",
};
export const revalidate = 21600;

export default function StreamLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}

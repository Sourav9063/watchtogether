import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function MusicLayout({ children }) {
  return <div className={poppins.className}>{children}</div>;
}

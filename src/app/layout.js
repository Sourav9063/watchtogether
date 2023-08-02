import "./globals.css";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Watch Together",
  description: "Simple website to play videos with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
        bodyStyle={{}}
        progressStyle={{ height: "2px" }}
      />
      <body className={inter.className}>{children}</body>
    </html>
  );
}

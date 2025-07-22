import config from "@/config";
import styles from "../../components/iframePlayer/iframePlayer.module.css";

export default function River() {
  return (
    <iframe
      allowFullScreen={true}
      className={`${styles["iframe"]} back-light `}
      style={{ width: "100%", minHeight: "100vh", margin:"0px" }}
      src={config.iframe.url15.split("/embed")[0]}
    />
  );
}

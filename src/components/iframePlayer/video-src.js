import styles from "./iframePlayer.module.css";
import config from "@/config";
import { useStore } from "@/helper/hooks/useStore";
import { Stores } from "@/helper/CONSTANTS";

export default function VideoSrc() {
  const [iframeUrl, setIframeUrl] = useStore(Stores.iframeUrl);
  const getSourceText = (url, index) => {
    let prefix = `Source ${index + 1}`;
    let suffix = "";
    switch (url) {
      case config.iframe.url1:
        suffix = " (All)";
        break;
      case config.iframe.url2:
        suffix = " (Fast)";
        break;
      case config.iframe.url3:
        suffix = " (Variety)";
        break;
      case config.iframe.url7:
        prefix = "Anime";
        suffix = "";
        break;
      default:
        break;
    }
    return prefix + suffix;
  };
  return (
    <div className={styles["src"]}>
      <div className={`${styles["src-list"]} ${styles[""]} `}>
        {config.iframe.urls.map((url, index) => {
          return (
            <button
              key={index}
              style={{
                backgroundColor:
                  iframeUrl.baseUrl === url
                    ? " var(--hover-color)"
                    : "var(--primary-color)",
              }}
              onClick={() => {
                setIframeUrl((state) => {
                  return { ...state, baseUrl: url };
                });
              }}
            >
              {getSourceText(url, index)}
            </button>
          );
        })}
      </div>
      <p>
        {
          "*If current server doesn't work please try other servers. You can download from some server."
        }
      </p>
      <button
        className={styles["focus"]}
        onClick={(e) => {
          e.preventDefault();
          document
            .querySelector("#iframe-player")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Focus
      </button>
    </div>
  );
}

import { TEXTS } from "../texts";
import { css } from "./styles";

export default function PrizeBondFooter() {
  return (
    <footer className={css("pb-footer")}>
      <h2>{TEXTS.footer.title}</h2>
      <ul>
        {TEXTS.footer.facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
      <div className={css("pb-footer-meta")}>
        <p>{TEXTS.footer.copyright}</p>
        <a
          href="https://sourav9063.github.io/"
          rel="noopener noreferrer"
          target="_blank"
        >
          {TEXTS.footer.developer}
        </a>
      </div>
    </footer>
  );
}

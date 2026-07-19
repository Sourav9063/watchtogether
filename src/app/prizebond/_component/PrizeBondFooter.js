import { TEXTS } from "../texts";
import { css } from "./styles";

export default function PrizeBondFooter() {
  return (
    <footer className={css("pb-footer")}>
      <h2>{TEXTS.footer.title}</h2>
      <ul>
        {TEXTS.footer.facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
    </footer>
  );
}

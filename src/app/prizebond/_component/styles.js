import styles from "../prizebond.module.css";

export function css(...classNames) {
  return classNames
    .filter(Boolean)
    .flatMap((className) => String(className).split(/\s+/))
    .filter(Boolean)
    .map((className) => styles[className] || className)
    .join(" ");
}

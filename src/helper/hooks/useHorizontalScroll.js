import { useEffect, useRef } from "react";

export function useHorizontalScroll(scrollMultiplier = 1) {
  const elRef = useRef();
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;

        const el = e.currentTarget;
        if (
          !(el.scrollLeft === 0 && e.deltaY < 0) &&
          !(
            el.scrollWidth - el.clientWidth - Math.round(el.scrollLeft) <= 0 &&
            e.deltaY > 0
          )
        ) {
          e.preventDefault();
        }
        el.scrollBy({
          left: e.deltaY * scrollMultiplier,
        });
      };
      el.addEventListener("wheel", onWheel);
      return () => el.removeEventListener("wheel", onWheel);
    }
  }, []);
  return elRef;
}

import { useEffect, useRef } from "react";

export function useDragScroll() {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let didDrag = false;
    let shouldSuppressNextClick = false;
    let clickSuppressTimeout = null;

    const resetClickSuppressor = () => {
      shouldSuppressNextClick = false;
      if (clickSuppressTimeout) {
        clearTimeout(clickSuppressTimeout);
        clickSuppressTimeout = null;
      }
    };

    const suppressNextRowClick = () => {
      resetClickSuppressor();
      shouldSuppressNextClick = true;
      clickSuppressTimeout = setTimeout(resetClickSuppressor, 250);
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;

      isDragging = true;
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
      didDrag = false;
      el.classList.add("dragScrollXActive");
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      if (Math.abs(deltaX) > 4) {
        didDrag = true;
        event.preventDefault();
      }
      el.scrollLeft = startScrollLeft - deltaX;
    };

    const stopDragging = () => {
      isDragging = false;
      el.classList.remove("dragScrollXActive");

      if (didDrag) {
        suppressNextRowClick();
      }
    };

    const handleClick = (event) => {
      if (!shouldSuppressNextClick) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      didDrag = false;
      resetClickSuppressor();
    };

    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    el.addEventListener("click", handleClick, true);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      el.removeEventListener("click", handleClick, true);
      resetClickSuppressor();
    };
  }, []);

  return elRef;
}

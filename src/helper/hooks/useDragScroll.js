import { useEffect, useRef } from "react";

export function useDragScroll() {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const dragMultiplier = 1.15;
    const minDragDistance = 4;
    const momentumFriction = 0.96;
    const minMomentumVelocity = 0.02;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let targetScrollLeft = 0;
    let lastX = 0;
    let lastMoveTime = 0;
    let velocity = 0;
    let animationFrame = null;
    let momentumFrame = null;
    let didDrag = false;
    let isHorizontalTouchDrag = false;
    let shouldSuppressNextClick = false;
    let clickSuppressTimeout = null;

    const cancelAnimation = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const cancelMomentum = () => {
      if (momentumFrame) {
        cancelAnimationFrame(momentumFrame);
        momentumFrame = null;
      }
    };

    const setScrollLeft = (nextScrollLeft) => {
      targetScrollLeft = nextScrollLeft;
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        el.scrollLeft = targetScrollLeft;
        animationFrame = null;
      });
    };

    const startDrag = (clientX, clientY) => {
      cancelMomentum();
      cancelAnimation();
      isDragging = true;
      startX = clientX;
      startY = clientY;
      startScrollLeft = el.scrollLeft;
      targetScrollLeft = el.scrollLeft;
      lastX = clientX;
      lastMoveTime = performance.now();
      velocity = 0;
      didDrag = false;
      isHorizontalTouchDrag = false;
      el.classList.add("dragScrollXActive");
    };

    const moveDrag = (clientX) => {
      const now = performance.now();
      const deltaX = clientX - startX;
      const elapsed = now - lastMoveTime;

      if (elapsed > 0) {
        velocity = ((lastX - clientX) * dragMultiplier) / elapsed;
      }

      lastX = clientX;
      lastMoveTime = now;
      setScrollLeft(startScrollLeft - deltaX * dragMultiplier);
    };

    const runMomentum = () => {
      if (Math.abs(velocity) < minMomentumVelocity) {
        momentumFrame = null;
        return;
      }

      el.scrollLeft += velocity * 16;
      velocity *= momentumFriction;
      momentumFrame = requestAnimationFrame(runMomentum);
    };

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

      startDrag(event.clientX, event.clientY);
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      if (Math.abs(deltaX) > minDragDistance) {
        didDrag = true;
        event.preventDefault();
      }
      moveDrag(event.clientX);
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      startDrag(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (event) => {
      if (!isDragging || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (!isHorizontalTouchDrag && Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      if (Math.abs(deltaX) > minDragDistance) {
        didDrag = true;
        isHorizontalTouchDrag = true;
        event.preventDefault();
      }

      if (isHorizontalTouchDrag) {
        moveDrag(touch.clientX);
      }
    };

    const stopDragging = () => {
      if (!isDragging) return;

      isDragging = false;
      el.classList.remove("dragScrollXActive");

      if (didDrag) {
        suppressNextRowClick();
        runMomentum();
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
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);
    el.addEventListener("click", handleClick, true);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
      el.removeEventListener("click", handleClick, true);
      cancelAnimation();
      cancelMomentum();
      resetClickSuppressor();
    };
  }, []);

  return elRef;
}

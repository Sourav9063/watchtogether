import { useState, useEffect } from "react";

export const useDelayUnmount = (show, delay) => {
  const [shouldMount, setShouldMount] = useState(show);
  useEffect(() => {
    let timeoutId;
    if (show && !shouldMount) {
      setTimeout(() => {
        setShouldMount(true);
      });
    } else if (!show && shouldMount) {
      timeoutId = setTimeout(() => {
        setShouldMount(false);
      }, delay);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [show, delay, shouldMount]);

  const getClassNames = (className, styles) => {
    const newClass = show
      ? shouldMount
        ? className + "-show"
        : className + "-init"
      : className + "-hide";

    return !styles
      ? `${className} ${newClass}`
      : `${styles[className]} ${styles[newClass]} `;
  };

  return [show || shouldMount, getClassNames];
};

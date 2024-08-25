import { useState, useEffect } from "react";

export const useDelayUnmount = (show, delay) => {
  const [shouldMount, setShouldMount] = useState(show);
  useEffect(() => {
    let timeoutId;
    if (show && !shouldMount) {
      setShouldMount(true);
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
    return `${styles[className]} ${
      styles[
        show
          ? shouldMount
            ? className + "-show"
            : className + "-init"
          : className + "-hide"
      ]
    } `;
  };

  return [show || shouldMount, getClassNames];
};

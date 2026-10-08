import { useEffect, useState } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1536,
};

export function useBreakpoints() {
  const getDeviceState = () => {
    const width = window.innerWidth;

    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
      is2K: width >= BREAKPOINTS.desktop,
    };
  };

  const [state, setState] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    is2K: false,
  });

  useEffect(() => {
    const update = () => setState(getDeviceState());

    update(); // initial render
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return state;
}

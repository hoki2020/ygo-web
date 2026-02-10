import { useEffect, useState } from "react";

import styles from "./OrientationGuard.module.scss";

const isCoarsePointer = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

const isPortrait = () => window.innerHeight > window.innerWidth;

export const OrientationGuard: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => {
      setShow(isCoarsePointer() && isPortrait());
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.title}>Landscape Required</div>
        <div className={styles.desc}>
          This build currently supports mobile landscape mode only.
          <br />
          Please rotate your phone to continue.
        </div>
      </div>
    </div>
  );
};

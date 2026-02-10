import React, { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

import { cardStore } from "@/stores";

import { Bg } from "../Bg";
import { Card } from "../Card";
import styles from "./index.module.scss";

// 后面再改名
export const Mat: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const [duelScale, setDuelScale] = useState(1);

  useEffect(() => {
    const isMobileLandscape = () => {
      if (!window.matchMedia) return false;
      return (
        window.matchMedia("(pointer: coarse)").matches &&
        window.innerWidth > window.innerHeight
      );
    };

    const updateScale = () => {
      const section = sectionRef.current;
      const plane = planeRef.current;
      if (!section || !plane) return;

      if (!isMobileLandscape()) {
        setDuelScale(1);
        return;
      }

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const baseWidth = plane.scrollWidth || plane.getBoundingClientRect().width;
      const baseHeight = plane.scrollHeight || plane.getBoundingClientRect().height;

      if (!baseWidth || !baseHeight) return;

      const widthScale = Math.max((viewportWidth - 20) / baseWidth, 0.1);
      const heightScale = Math.max((viewportHeight - 20) / baseHeight, 0.1);
      const nextScale = Math.min(widthScale, heightScale, 1);

      setDuelScale(Number(nextScale.toFixed(4)));
    };

    const rafId = window.requestAnimationFrame(updateScale);
    const timeoutId = window.setTimeout(updateScale, 180);

    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.mat}
      style={{ ["--duel-scale" as string]: duelScale }}
    >
      <div className={styles["hud-grid"]} />
      <div className={styles["hud-corners"]} />
      <div className={styles.camera}>
        <div className={styles.plane} ref={planeRef}>
          <Bg />
          <div className={styles.container}>
            <Cards />
          </div>
        </div>
      </div>
    </section>
  );
};

const Cards: React.FC = () => {
  const { inner } = useSnapshot(cardStore);
  const length = inner.length;
  return (
    <>
      {Array.from({ length }).map((_, i) => (
        <Card key={inner[i].uuid} idx={i} />
      ))}
    </>
  );
};

import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { matStore } from "@/stores";

import styles from "./index.module.scss";

type PhaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const PHASE_TEXT: Partial<Record<PhaseType, string>> = {
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.DRAW]: "DRAW PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.STANDBY]: "STANDBY PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.MAIN1]: "MAIN PHASE 1",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE]: "BATTLE PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_START]: "BATTLE PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_STEP]: "BATTLE PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE]: "BATTLE PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE_GAL]: "BATTLE PHASE",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.MAIN2]: "MAIN PHASE 2",
  [ygopro.StocGameMessage.MsgNewPhase.PhaseType.END]: "END PHASE",
};

export const PhaseSplash: React.FC = () => {
  const { currentPhase } = useSnapshot(matStore.phase);
  const { currentPlayer, turnCount } = useSnapshot(matStore);
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const [splashKey, setSplashKey] = useState(0);

  useEffect(() => {
    if (!PHASE_TEXT[currentPhase]) return;

    setText(PHASE_TEXT[currentPhase] || "");
    setVisible(true);
    setSplashKey((v) => v + 1);

    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [currentPhase, turnCount]);

  if (!visible || !text) return null;

  const isMyTurn = matStore.isMe(currentPlayer);

  return (
    <div
      key={splashKey}
      className={classNames(styles.container, {
        [styles.me]: isMyTurn,
        [styles.op]: !isMyTurn,
      })}
    >
      <div className={styles.band} />
      <div className={styles.topLine} />
      <div className={styles.bottomLine} />
      <h1 className={styles.text}>{text}</h1>
    </div>
  );
};

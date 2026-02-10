import { ClockCircleOutlined } from "@ant-design/icons";
import { Progress } from "antd";
import classNames from "classnames";
import React, { useEffect, useMemo, useState } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { useEnv } from "@/hook";
import { accountStore, matStore, roomStore } from "@/stores";

import styles from "./index.module.scss";

export const LifeBar: React.FC = () => {
  const snapInitInfo = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(roomStore);
  const { currentPlayer, turnCount, waiting } = useSnapshot(matStore);
  const { user } = useSnapshot(accountStore);
  const { assetsPath } = useConfig();
  const defaultAvatar = `${assetsPath}/default-avatar.png`;

  const [meLife, setMeLife] = useState(0);
  const [opLife, setOpLife] = useState(0);

  useEffect(() => {
    setMeLife(snapInitInfo.me.life);
  }, [snapInitInfo.me.life]);

  useEffect(() => {
    setOpLife(snapInitInfo.op.life);
  }, [snapInitInfo.op.life]);

  const snapTimeLimit = useSnapshot(matStore.timeLimits);
  const [myTimeLimit, setMyTimeLimit] = useState(snapTimeLimit.me);
  const [opTimeLimit, setOpTimeLimit] = useState(snapTimeLimit.op);
  useEffect(() => {
    setMyTimeLimit(snapTimeLimit.me);
  }, [snapTimeLimit.me]);
  useEffect(() => {
    setOpTimeLimit(snapTimeLimit.op);
  }, [snapTimeLimit.op]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMyTimeLimit((time) => time - 1);
      setOpTimeLimit((time) => time - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (useEnv().VITE_IS_AI_MODE) {
      setMyTimeLimit(240);
      setOpTimeLimit(240);
    }
  }, [currentPlayer]);

  const meAvatar = user?.avatar_url || defaultAvatar;
  const opAvatar = defaultAvatar;

  return (
    <div className={styles.container}>
      <LifeBarItem
        active={!matStore.isMe(currentPlayer)}
        name={snapPlayer.getOpPlayer()?.name ?? "Opponent"}
        life={opLife}
        timeLimit={opTimeLimit}
        avatarUrl={opAvatar}
        fallbackAvatar={defaultAvatar}
        isMe={false}
        thinking={waiting}
      />
      <div className={styles.turnBadge}>TURN {Math.max(turnCount, 1)}</div>
      <LifeBarItem
        active={matStore.isMe(currentPlayer)}
        name={snapPlayer.getMePlayer()?.name ?? "Player"}
        life={meLife}
        timeLimit={myTimeLimit}
        avatarUrl={meAvatar}
        fallbackAvatar={defaultAvatar}
        isMe={true}
        thinking={false}
      />
    </div>
  );
};

const LifeBarItem: React.FC<{
  active: boolean;
  name: string;
  life: number;
  timeLimit: number;
  avatarUrl: string;
  fallbackAvatar: string;
  isMe: boolean;
  thinking: boolean;
}> = ({ active, name, life, timeLimit, avatarUrl, fallbackAvatar, isMe, thinking }) => {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl || fallbackAvatar);
  useEffect(() => {
    setCurrentAvatar(avatarUrl || fallbackAvatar);
  }, [avatarUrl, fallbackAvatar]);

  const safeTime = Math.max(timeLimit, 0);
  const mm = Math.floor(safeTime / 60);
  const ss = safeTime % 60;
  const timeText = `${mm < 10 ? `0${mm}` : mm}:${ss < 10 ? `0${ss}` : ss}`;
  const percent = Math.max(0, Math.min(100, Math.floor((safeTime / 240) * 100)));

  const roleText = useMemo(() => (isMe ? "PLAYER" : "OPPONENT"), [isMe]);
  const lowLife = Math.max(life, 0) < 1000;

  return (
    <div className={classNames(styles.item, { [styles.me]: isMe, [styles.op]: !isMe })}>
      <div
        className={classNames(styles["life-panel"], {
          [styles.active]: active,
        })}
      >
        <div className={styles["name-row"]}>
          <span className={styles.role}>{roleText}</span>
          <span className={styles.name}>{name}</span>
        </div>
        <div className={styles["life-row"]}>
          <span className={styles["lp-tag"]}>LP</span>
          <span className={classNames(styles.life, { [styles.low]: lowLife })}>
            <AnimatedNumbers animateToNumber={Math.max(life, 0)} />
          </span>
        </div>
        {active && (
          <div className={styles["timer-container"]}>
            <ClockCircleOutlined className={styles["clock-icon"]} />
            <Progress
              type="circle"
              percent={percent}
              strokeWidth={20}
              size={14}
              showInfo={false}
            />
            <span className={styles["timer-text"]}>{timeText}</span>
          </div>
        )}
      </div>
      <div className={styles.portrait}>
        <img
          src={currentAvatar}
          alt={name}
          onError={(e) => {
            if (currentAvatar !== fallbackAvatar) {
              setCurrentAvatar(fallbackAvatar);
            } else {
              e.currentTarget.style.visibility = "hidden";
            }
          }}
        />
        {thinking && !isMe && (
          <div className={styles.thinking}>
            <span className={styles["thinking-dot"]} />
            <span className={styles["thinking-dot"]} />
            <span className={styles["thinking-dot"]} />
          </div>
        )}
      </div>
    </div>
  );
};

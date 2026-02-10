import { MessageOutlined } from "@ant-design/icons";
import { message, notification } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { HandResult, matStore } from "@/stores";
import { useChat } from "@/ui/Shared";

import styles from "./index.module.scss";

const NeosConfig = useConfig();

let globalMsgApi: ReturnType<typeof message.useMessage>[0] | undefined;
export const HintNotification = () => {
  const matSnap = useSnapshot(matStore);
  const hintState = matSnap.hint;
  const toss = matSnap.tossResult;
  const handResults = matSnap.handResults;
  const error = matSnap.error;

  const [floatingText, setFloatingText] = useState("");
  const [floatingVisible, setFloatingVisible] = useState(false);
  const [floatingKey, setFloatingKey] = useState(0);
  const floatingTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const { dialogs } = useChat(true);
  const [msgApi, msgContextHolder] = message.useMessage({
    maxCount: NeosConfig.ui.hint.maxCount,
  });
  const [notiApi, notiContextHolder] = notification.useNotification({
    maxCount: NeosConfig.ui.hint.maxCount,
  });

  globalMsgApi = msgApi;

  const showFloatingHint = (text: string) => {
    if (!text) return;
    setFloatingText(text);
    setFloatingVisible(true);
    setFloatingKey((prev) => prev + 1);
    clearTimeout(floatingTimer.current);
    floatingTimer.current = setTimeout(() => {
      setFloatingVisible(false);
    }, 1800);
  };

  useEffect(() => {
    return () => clearTimeout(floatingTimer.current);
  }, []);

  useEffect(() => {
    if (hintState && hintState.msg) {
      showFloatingHint(`${hintState.msg}`);
    }
  }, [hintState.msg]);

  useEffect(() => {
    if (toss) {
      showFloatingHint(`${toss}`);
    }
  }, [toss]);

  useEffect(() => {
    const meHand = handResults.me;
    const opHand = handResults.op;
    if (meHand !== HandResult.UNKNOWN && opHand !== HandResult.UNKNOWN) {
      showFloatingHint(`我方出示 ${getHandResultText(meHand)}，对方出示 ${getHandResultText(opHand)}`);
    }
  }, [handResults]);

  useEffect(() => {
    if (error !== "") {
      msgApi.error(error);
    }
  }, [error]);

  useEffect(() => {
    const latest = dialogs.at(-1);
    if (latest) {
      notiApi.open({
        message: latest.name,
        description: latest.content,
        icon: <MessageOutlined />,
      });
    }
  }, [dialogs]);

  return (
    <>
      {msgContextHolder}
      {notiContextHolder}
      <div
        key={floatingKey}
        className={`${styles.floatingHint} ${floatingVisible ? styles.visible : ""}`}
      >
        {floatingText}
      </div>
    </>
  );
};

let isWaiting = false;
let destoryTimer: NodeJS.Timeout | undefined;
const waitingKey = "waiting";
export const showWaiting = (open: boolean) => {
  matStore.waiting = open;
  if (open) {
    if (!isWaiting) {
      globalMsgApi?.destroy(waitingKey);
      clearTimeout(destoryTimer);
      isWaiting = true;
      destoryTimer = undefined;
    }
  } else {
    if (!destoryTimer) {
      destoryTimer = setTimeout(() => {
        globalMsgApi?.destroy(waitingKey);
        isWaiting = false;
      }, 1000);
    }
  }
};

function getHandResultText(res: HandResult): string {
  switch (res) {
    case HandResult.UNKNOWN:
      return "?";
    case HandResult.ROCK:
      return "石头";
    case HandResult.PAPER:
      return "布";
    case HandResult.SCISSOR:
      return "剪刀";
  }
}

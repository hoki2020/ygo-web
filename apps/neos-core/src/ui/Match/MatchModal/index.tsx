import { App, Button, Input, Modal } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { useConfig } from "@/config";
import { WebSocketStream } from "@/infra";
import { accountStore, roomStore } from "@/stores";
import { Select } from "@/ui/Shared";

import { connectSrvpro } from "../util";
import styles from "./index.module.scss";

const NeosConfig = useConfig();
const serverConfig = NeosConfig.servers;

const getServerIndex = (name: string, fallback = 0) => {
  const idx = serverConfig.findIndex((server) => server.name === name);
  return idx >= 0 ? idx : fallback;
};

const LOCAL_SRPRO_WS_INDEX = getServerIndex("local-srvpro-ws", 0);
const KOISHI_INDEX = getServerIndex("koishi", LOCAL_SRPRO_WS_INDEX);
const PRERELEASE_INDEX = getServerIndex("pre-release", KOISHI_INDEX);
const ENV_408 = getServerIndex("408", KOISHI_INDEX);

const {
  defaults: { defaultPlayer, defaultPassword },
  automation: { isAiMode },
} = useConfig();

interface Props {
  open?: boolean;
}

const defaultProps: Props = {
  open: false,
};

export const matchStore = proxy<Props>(defaultProps);

export const MatchModal: React.FC = ({}) => {
  const { message } = App.useApp();
  const { open } = useSnapshot(matchStore);
  const { user } = useSnapshot(accountStore);
  const { joined, errorMsg } = useSnapshot(roomStore);
  const [player, setPlayer] = useState(user?.name ?? defaultPlayer);
  const [passwd, setPasswd] = useState(defaultPassword);
  const [serverId, setServerId] = useState(LOCAL_SRPRO_WS_INDEX);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("MatchModal");

  const handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  const handleServerChange = (value: any) => {
    setServerId(value);
  };
  const handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };
  const send408Hint = (conn: WebSocketStream) => {
    setTimeout(
      () =>
        sendChat(
          conn,
          "由于技术原因，408环境卡池内可用卡牌暂无法直接标出，某些卡片实际使用的是旧效果，例如混沌之黑魔术师、多尔·多拉、死之卡组破坏病毒...",
        ),
      1000,
    );
  };

  const handleSubmit = async () => {
    setConfirmLoading(true);
    try {
      await connectSrvpro({
        player,
        ip: genServerAddress(serverId),
        passWd: passwd,
        enableKuriboh: false,
        customOnConnected: serverId === ENV_408 ? send408Hint : undefined,
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to connect server";
      message.error(text);
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    // 如果开启了AI模式，直接进入房间
    if (isAiMode) {
      handleSubmit();
    }
  }, []);

  useEffect(() => {
    // 如果一切顺利的话，后端传来已加入房间的信号，这时候跳转到房间页面
    if (joined) {
      navigate(`/waitroom`);
    }
  }, [joined]);

  useEffect(() => {
    // 出现错误
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      setConfirmLoading(false);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <Modal
      rootClassName={styles.modal}
      open={open}
      title={i18n("PleaseEnterCustomRoomInformation")}
      onCancel={() => (matchStore.open = false)}
      footer={
        <Button className={styles.actionBtn} onClick={handleSubmit} loading={confirmLoading}>
          {i18n("JoinRoom")}
        </Button>
      }
      confirmLoading={confirmLoading}
      centered
    >
      <div className={styles["inputs-container"]}>
        <Select
          className={styles.select}
          title={i18n("Server")}
          value={serverId}
          options={[
            {
              value: LOCAL_SRPRO_WS_INDEX,
              label: "Local SRVPro (ws://127.0.0.1:7912)",
            },
            {
              value: KOISHI_INDEX,
              label: i18n("KoishiServer"),
            },
            {
              value: PRERELEASE_INDEX,
              label: i18n("UltraPreemptiveServer"),
            },
            {
              value: ENV_408,
              label: i18n("408"),
            },
          ]}
          onChange={handleServerChange}
        />
        <Input
          className={styles.input}
          type="text"
          placeholder={i18n("PlayerNickname")}
          value={player}
          onChange={handlePlayerChange}
          required
        />
        <Input
          className={styles.input}
          type="text"
          autoCorrect="off"
          placeholder={i18n("RoomPasswordOptional")}
          value={passwd}
          onChange={handlePasswdChange}
        />
      </div>
    </Modal>
  );
};

  const genServerAddress = (id: number) => {
    return `${serverConfig[id].ip}:${serverConfig[id].port}`;
  };

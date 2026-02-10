import { EditOutlined, LoadingOutlined, SettingFilled } from "@ant-design/icons";
import { App } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { AudioActionType, changeScene } from "@/infra/audio";
import { resetUniverse, roomStore } from "@/stores";
import { Background, IconFont, SpecialButton } from "@/ui/Shared";
import { openSettingPanel } from "@/ui/Setting";

import styles from "./index.module.scss";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";

export const loader: LoaderFunction = () => {
  resetUniverse();
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const { t: i18n } = useTranslation("Match");
  const { joined } = useSnapshot(roomStore);
  const navigate = useNavigate();
  const [customRoomLoading, setCustomRoomLoading] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const { assetsPath } = useConfig();
  App.useApp();

  const onCustomRoom = () => {
    setCustomRoomLoading(true);
    matchStore.open = true;
    setTimeout(() => setCustomRoomLoading(false), 200);
  };

  const onReplay = () => {
    setReplayLoading(true);
    replayOpen();
    setTimeout(() => setReplayLoading(false), 200);
  };

  useEffect(() => {
    if (joined) {
      setCustomRoomLoading(false);
      setReplayLoading(false);
      navigate("/waitroom");
    }
  }, [joined]);

  return (
    <>
      <Background />
      <div className={styles.container}>
        <div className={styles.wrap}>
          <div className={styles.hero}>
            <img
              className={styles["hero-bg"]}
              src={`${assetsPath}/neos-main-bg.webp`}
              alt="match-hero"
            />
            <img
              className={styles["hero-main"]}
              src={`${assetsPath}/neos-main.webp`}
              alt="match-hero-main"
            />
            <div className={styles.overlay} />
          </div>
          <div className={styles.actions}>
            <SpecialButton className={styles["menu-btn"]} onClick={onCustomRoom}>
              <span>
                {customRoomLoading
                  ? "\u8FDE\u63A5\u4E2D..."
                  : "\u5F00\u59CB\u6E38\u620F"}
              </span>
              {customRoomLoading ? <LoadingOutlined /> : <IconFont type="icon-play" size={16} />}
            </SpecialButton>
            <SpecialButton className={styles["menu-btn"]} onClick={onReplay}>
              <span>
                {replayLoading
                  ? "\u8BFB\u53D6\u4E2D..."
                  : "\u65E7\u7684\u56DE\u5FC6"}
              </span>
              {replayLoading ? <LoadingOutlined /> : <IconFont type="icon-record" size={16} />}
            </SpecialButton>
            <SpecialButton className={styles["menu-btn-sub"]} onClick={() => navigate("/build")}>
              <span>{i18n("DeckEdit")}</span>
              <EditOutlined />
            </SpecialButton>
            <SpecialButton
              className={styles["menu-btn-sub"]}
              onClick={() => openSettingPanel({ defaultKey: "audio" })}
            >
              <span>{"\u7CFB\u7EDF\u8BBE\u7F6E"}</span>
              <SettingFilled />
            </SpecialButton>
          </div>
        </div>
      </div>
      <MatchModal />
      <ReplayModal />
    </>
  );
};
Component.displayName = "Match";

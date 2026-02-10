import { HistoryOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { getSSOSignInUrl } from "@/api";
import { useConfig } from "@/config";
import { AudioActionType, changeScene } from "@/infra/audio";
import { accountStore, initStore } from "@/stores";
import { Background, Loading, SpecialButton } from "@/ui/Shared";

import styles from "./index.module.scss";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  // 更新场景
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const { t } = useTranslation("Start");
  const { user } = useSnapshot(accountStore);
  const { progress } = useSnapshot(initStore.sqlite);
  return (
    <>
      <Background />
      <div className={styles.wrap}>
        {progress === 1 ? (
          <main className={styles.main}>
            <div className={styles.hero}>
              <img
                className={styles["hero-bg"]}
                src={`${NeosConfig.assetsPath}/neos-main-bg.webp`}
                alt="hero"
              />
              <img
                className={styles["hero-main"]}
                src={`${NeosConfig.assetsPath}/neos-main.webp`}
                alt="hero-main"
              />
              <div className={styles.overlay} />
            </div>
            <div className={styles.center}>
              <img
                className={styles["neos-logo"]}
                src={`${NeosConfig.assetsPath}/neos-logo.svg`}
                alt="YGO NEOS"
              />
              <div className={styles.title}>DUEL ARENA</div>
            </div>
            <div className={styles.actions}>
              <LoginBtn logined={Boolean(user)} />
              <MemoryBtn />
            </div>
          </main>
        ) : (
          <Loading progress={progress * 100} />
        )}
      </div>
    </>
  );
};
Component.displayName = "Start";

const LoginBtn: React.FC<{ logined: boolean }> = ({ logined }) => {
  const { t } = useTranslation("Start");
  const navigate = useNavigate();

  const loginViaSSO = () =>
    // 跳转回match页
    location.replace(getSSOSignInUrl(`${location.origin}/match/`));

  const goToMatch = () => navigate("/match");

  return (
    <SpecialButton className={styles["menu-btn"]} onClick={logined ? goToMatch : loginViaSSO}>
      <span>{logined ? t("StartGame") : t("LoginToGame")}</span>
      <RightOutlined />
    </SpecialButton>
  );
};

const MemoryBtn: React.FC = () => {
  const navigate = useNavigate();
  return (
    <SpecialButton className={styles["menu-btn"]} onClick={() => navigate("/match")}>
      <span>旧的回忆</span>
      <HistoryOutlined />
    </SpecialButton>
  );
};

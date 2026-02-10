import {
  FullscreenOutlined,
  SettingFilled,
} from "@ant-design/icons";
import { App } from "antd";
import classNames from "classnames";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  type LoaderFunction,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useConfig } from "@/config";

import { setCssProperties } from "../Duel/PlayMat/css";
import { OrientationGuard } from "./OrientationGuard";
import { Setting } from "../Setting";
import styles from "./index.module.scss";
import {
  getLoginStatus,
  handleSSOLogin,
  initDeck,
  initSqlite,
} from "./utils";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  getLoginStatus();
  await initDeck();
  void initSqlite();

  // set some styles
  setCssProperties();

  return null;
};

const HeaderBtn: React.FC<
  React.PropsWithChildren<{ to: string; disabled?: boolean }>
> = ({ to, children, disabled = false }) => {
  const Element = disabled ? "div" : NavLink;
  return (
    <Element
      to={disabled ? "/" : to}
      className={classNames(styles.link, { [styles.disabled]: disabled })}
    >
      {children}
    </Element>
  );
};

export const Component = () => {
  const { t: i18n } = useTranslation("Header");

  // 捕获SSO登录
  const routerLocation = useLocation();
  useEffect(() => {
    routerLocation.search && handleSSOLogin(routerLocation.search);
  }, [routerLocation.search]);

  const { pathname } = routerLocation;
  const pathnamesHideHeader = ["/", "/match", "/waitroom", "/duel", "/side"];
  const isBuildRoute = pathname.startsWith("/build");
  const { modal } = App.useApp();

  return (
    <>
      <OrientationGuard />
      {!pathnamesHideHeader.includes(pathname) && (
        <nav className={styles.navbar}>
          {isBuildRoute ? (
            <HeaderBtn to="/match">对战</HeaderBtn>
          ) : (
            <>
              <a
                href="https://github.com/DarkNeos/neos-ts"
                title="repo"
                className={styles["logo-container"]}
              >
                <img
                  className={styles.logo}
                  src={`${NeosConfig.assetsPath}/neos-logo.svg`}
                  alt="NEOS"
                />
              </a>

              <HeaderBtn to="/">{i18n("HomePage")}</HeaderBtn>
              <HeaderBtn to="/match">
                {i18n("Match")}
              </HeaderBtn>
              <span style={{ flexGrow: 1 }} />
              <span className={styles.profile}>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    modal.info({
                      content: (
                        <>
                          <Setting />
                        </>
                      ),
                      centered: true,
                      maskClosable: true,
                      icon: null,
                      footer: null,
                    });
                  }}
                >
                  <SettingFilled style={{ marginRight: 6 }} />
                  {i18n("SystemSettings")}
                </button>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => document.documentElement.requestFullscreen()}
                >
                  <FullscreenOutlined style={{ marginRight: 6 }} />
                  {i18n("Fullscreen")}
                </button>
              </span>
            </>
          )}
        </nav>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
};


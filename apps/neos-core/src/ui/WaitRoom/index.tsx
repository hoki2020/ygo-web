import { CheckCircleFilled, LoadingOutlined } from "@ant-design/icons";
import HandType = ygopro.HandType;
import {
  sendHandResult,
  sendHsNotReady,
  sendHsReady,
  sendHsStart,
  sendHsToDuelList,
  sendHsToObserver,
  sendTpResult,
  sendUpdateDeck,
  ygopro,
} from "@/api";
import PlayerState = ygopro.StocHsPlayerChange.State;
import SelfType = ygopro.StocTypeChange.SelfType;
import { App, Avatar, Button, Skeleton, Space } from "antd";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { getUIContainer } from "@/container/compat";
import { AudioActionType, changeScene } from "@/infra/audio";
import { closeSocket } from "@/middleware/socket";
import {
  accountStore,
  deckStore,
  IDeck,
  Player,
  resetUniverse,
  RoomStage,
  roomStore,
  sideStore,
} from "@/stores";
import { Background, IconFont, Select, SpecialButton } from "@/ui/Shared";

import { Chat } from "./Chat";
import styles from "./index.module.scss";
import { Mora, MoraPopover, Tp, TpPopover } from "./Popover";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const container = getUIContainer();
  const { t: i18n } = useTranslation("WaitRoom");
  const { message } = App.useApp();
  const { user } = useSnapshot(accountStore);
  const { decks } = deckStore;
  const defaultDeck =
    decks.length > 0 ? JSON.parse(JSON.stringify(decks[0])) : undefined;
  const [deck, setDeck] = useState<IDeck | undefined>(defaultDeck);
  const room = useSnapshot(roomStore);
  const { errorMsg } = room;
  const me = room.getMePlayer();
  const op = room.getOpPlayer();
  const navigate = useNavigate();

  const updateDeck = (nextDeck: IDeck) => {
    sendUpdateDeck(container.conn, nextDeck);
    sideStore.setSideDeck(nextDeck);
  };

  const onDeckSelected = (deckName: string) => {
    const newDeck = deckStore.get(deckName);
    if (newDeck) {
      sendHsNotReady(container.conn);
      updateDeck(newDeck);
      setDeck(newDeck);
    } else {
      message.error(`Deck ${deckName} not found`);
    }
  };

  const onReady = () => {
    if (me?.state === PlayerState.NO_READY) {
      if (deck) {
        updateDeck(deck);
        sendHsReady(container.conn);
      } else {
        message.error("请先选择卡组");
      }
    } else {
      sendHsNotReady(container.conn);
    }
  };

  useEffect(() => {
    if (deck) sendUpdateDeck(container.conn, deck);
  }, []);

  useEffect(() => {
    if (room.stage === RoomStage.DUEL_START) {
      navigate("/duel");
    }
  }, [room.stage]);

  useEffect(() => {
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <div className={styles.container}>
      <Background />
      <div className={styles["chat-float"]}>
        <Chat />
      </div>
      <div className={styles.content}>
        <div className={styles.wrap}>
          <div className={styles["versus-stage"]}>
            <PlayerZone
              who={Who.Me}
              player={me}
              avatar={user?.avatar_url}
              ready={me?.state === PlayerState.READY}
            />
            <div className={styles.vs}>VS</div>
            <PlayerZone who={Who.Op} player={op} ready={op?.state === PlayerState.READY} />
          </div>

          <div className={styles["control-dock"]}>
            <ControlRow
              onDeckChange={onDeckSelected}
              onReady={onReady}
              canReady={room.stage === RoomStage.WAITING}
            />
            <div className={styles["action-row"]}>
              <Button
                className={classNames(styles["neos-btn"], styles.danger)}
                icon={<IconFont type="icon-exit" size={16} />}
                onClick={() => {
                  closeSocket(getUIContainer().conn);
                  resetUniverse();
                  navigate("/match");
                }}
              >
                {i18n("LeaveRoom")}
              </Button>
              <Button
                className={styles["neos-btn"]}
                icon={<IconFont type="icon-record" size={16} />}
                onClick={() => {
                  if (room.selfType !== SelfType.OBSERVER) {
                    sendHsToObserver(container.conn);
                  } else {
                    sendHsToDuelList(container.conn);
                  }
                }}
              >
                {room.selfType === SelfType.OBSERVER
                  ? i18n("JoinDuelist")
                  : i18n("JoinSpectator")}
              </Button>
            </div>
            <ActionButton
              onMoraSelect={(mora) => {
                sendHandResult(container.conn, mora);
                roomStore.stage = RoomStage.HAND_SELECTED;
              }}
              onTpSelect={(tp) => {
                sendTpResult(container.conn, tp === Tp.First);
                roomStore.stage = RoomStage.TP_SELECTED;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

enum Who {
  Me = "me",
  Op = "op",
}

const PlayerZone: React.FC<{
  who: Who;
  player?: Player;
  avatar?: string;
  ready: boolean;
}> = ({ who, player, avatar, ready }) => {
  return (
    <div className={classNames(styles["team-box"], styles[who], { [styles.ready]: ready })}>
      <div className={styles.inner} />
      <div className={styles["avatar-wrap"]}>
        <Avatar
          src={
            avatar && player
              ? avatar
              : player && player.state !== PlayerState.LEAVE
                ? `${NeosConfig.assetsPath}/default-avatar.png`
                : ""
          }
          size={66}
        />
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>
          {player && player.state !== PlayerState.LEAVE ? (
            player.name
          ) : (
            <Skeleton.Input size="small" />
          )}
        </div>
        <div className={classNames(styles.status, { [styles.on]: ready, [styles.off]: !ready })}>
          {ready ? (
            <>
              <CheckCircleFilled className={styles.check} /> READY
            </>
          ) : (
            "NOT READY"
          )}
        </div>
      </div>
    </div>
  );
};

const ControlRow: React.FC<{
  onDeckChange: (deckName: string) => void;
  onReady: () => void;
  canReady: boolean;
}> = ({ onDeckChange, onReady, canReady }) => {
  const { t: i18n } = useTranslation("WaitRoom");
  const snapDeck = useSnapshot(deckStore);
  const room = useSnapshot(roomStore);
  const me = room.getMePlayer();

  return (
    <Space className={styles.controller} size={10}>
      <Select
        className={styles["deck-select"]}
        title={i18n("Deck")}
        showSearch
        style={{ width: "17rem" }}
        defaultValue={snapDeck.decks[0].deckName}
        options={snapDeck.decks.map((deck) => ({ value: deck.deckName, title: deck.deckName }))}
        onChange={
          // @ts-ignore
          (value) => onDeckChange(value)
        }
      />
      <Button
        size="large"
        className={classNames(styles["neos-btn"], styles["btn-ready"])}
        onClick={onReady}
        disabled={!canReady}
      >
        {me?.state === PlayerState.NO_READY ? i18n("DuelReady") : i18n("CancelReady")}
      </Button>
    </Space>
  );
};

const ActionButton: React.FC<{
  onMoraSelect: (mora: Mora) => void;
  onTpSelect: (tp: Tp) => void;
}> = ({ onMoraSelect, onTpSelect }) => {
  const container = getUIContainer();
  const room = useSnapshot(roomStore);
  const { stage, isHost } = room;
  const { t: i18n } = useTranslation("WaitRoom");

  return (
    <MoraPopover onSelect={onMoraSelect}>
      <TpPopover onSelect={onTpSelect}>
        <SpecialButton
          className={styles["btns-action"]}
          disabled={
            stage !== RoomStage.WAITING ||
            (stage === RoomStage.WAITING &&
              (!isHost ||
                room.getMePlayer()?.state !== PlayerState.READY ||
                room.getOpPlayer()?.state !== PlayerState.READY))
          }
          onClick={() => {
            sendHsStart(container.conn);
          }}
        >
          {stage === RoomStage.WAITING ? (
            <>
              <IconFont type="icon-play" size={12} />
              <span>{i18n("StartGame")}</span>
            </>
          ) : stage === RoomStage.HAND_SELECTING ? (
            <>
              <IconFont type="icon-mora" size={20} />
              <span>{i18n("PlsRockPaperScissors")}</span>
            </>
          ) : stage === RoomStage.HAND_SELECTED ? (
            <>
              <LoadingOutlined />
              <span>{i18n("WaitOpponentPlayRockPaperScissors")}</span>
            </>
          ) : stage === RoomStage.TP_SELECTING ? (
            <>
              <IconFont type="icon-one" size={18} />
              <span>{i18n("PlsChooseWhoGoesFirst")}</span>
            </>
          ) : (
            <>
              <LoadingOutlined />
              <span>{i18n("WaitingForGameToStart")}</span>
            </>
          )}
        </SpecialButton>
      </TpPopover>
    </MoraPopover>
  );
};

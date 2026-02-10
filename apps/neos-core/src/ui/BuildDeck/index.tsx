import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App, Button, Input, message, Space, Tooltip } from "antd";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd-multi-backend";
import { useTranslation } from "react-i18next";
import { LoaderFunction } from "react-router-dom";
import { useSnapshot } from "valtio";

import { type CardMeta } from "@/api";
import { isExtraDeckCard } from "@/common";
import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, emptyDeck, type IDeck, initStore } from "@/stores";
import {
  Background,
  DeckCardMouseUpEvent,
  DeckZone,
  Loading,
  ScrollableArea,
  Select,
} from "@/ui/Shared";
import { Type } from "@/ui/Shared/DeckZone";

import { CardDetail } from "./CardDetail";
import { DeckDatabase } from "./DeckDatabase";
import { DeckSelect } from "./DeckSelect";
import styles from "./index.module.scss";
import { initForbidden, initI18N, initSqlite } from "../Layout/utils";
import { editDeckStore } from "./store";
import { getSelectedDeck, selectedCard, setSelectedDeck } from "./sharedState";
import {
  copyDeckToClipboard,
  downloadDeckAsYDK,
  editingDeckToIDeck,
  iDeckToEditingDeck,
} from "./utils";

const ENV_OCG = 0;
const ENV_408 = 1;

const isTouchDevice = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

export const loader: LoaderFunction = async () => {
  if (!initStore.decks) {
    await deckStore.initialize();
    initStore.decks = true;
  }
  await Promise.all([initSqlite(), initForbidden(), initI18N()]);

  // 鏇存柊鍦烘櫙
  changeScene(AudioActionType.BGM_DECK);

  return null;
};

export const Component: React.FC = () => {
  const selectedDeck = getSelectedDeck();
  const snapDecks = useSnapshot(deckStore);
  const { progress } = useSnapshot(initStore.sqlite);
  const { deck: snapSelectedDeck } = useSnapshot(selectedDeck);

  const { message } = App.useApp();
  const { t: i18n } = useTranslation("BuildDeck");
  const handleDeckEditorReset = async () => {
    editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
    message.info(`${i18n("ResetSuccessful")}`);
  };

  const handleDeckEditorSave = async () => {
    const tmpIDeck = editingDeckToIDeck(editDeckStore);
    const result = await deckStore.update(selectedDeck.deck.deckName, tmpIDeck);
    if (result) {
      setSelectedDeck(tmpIDeck);
      message.info(`${i18n("SaveSuccessful")}`);
      editDeckStore.edited = false;
    } else {
      editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
      message.error("淇濆瓨澶辫触");
      editDeckStore.edited = false;
    }
  };

  const handleDeckEditorShuffle = () => {
    editDeckStore.shuffle(editDeckStore);
  };

  const handleDeckEditorSort = () => {
    editDeckStore.sort(editDeckStore);
  };

  return (
    <DndProvider options={HTML5toTouch}>
      <Background />
      <div className={styles.layout} style={{ width: "100%" }}>
        <div className={styles.sider}>
          <ScrollableArea className={styles["deck-select-container"]}>
            <DeckSelect
              decks={snapDecks.decks as IDeck[]}
              selected={snapSelectedDeck.deckName}
              onSelect={(name) =>
                setSelectedDeck(deckStore.get(name) ?? emptyDeck)
              }
              onDelete={async (name) => await deckStore.delete(name)}
              onDownload={(name) => {
                const deck = deckStore.get(name);
                if (deck) downloadDeckAsYDK(deck);
              }}
              onCopy={async (name) => {
                const deck = deckStore.get(name);
                if (deck) return await copyDeckToClipboard(deck);
                else return false;
              }}
            />
          </ScrollableArea>
          <HigherCardDetail />
        </div>
        <div className={styles.content}>
          {progress === 1 ? (
            <>
              <div className={styles.deck}>
                <DeckEditor
                  deck={snapSelectedDeck as IDeck}
                  onClear={editDeckStore.clear}
                  onReset={handleDeckEditorReset}
                  onSave={handleDeckEditorSave}
                  onShuffle={handleDeckEditorShuffle}
                  onSort={handleDeckEditorSort}
                />
              </div>
              <div className={styles.select}>
                <DeckDatabase />
              </div>
            </>
          ) : (
            <div className={styles.container}>
              <Loading progress={progress * 100} />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
Component.displayName = "Build";

/** 姝ｅ湪缂栬緫鐨勫崱缁?*/
export const DeckEditor: React.FC<{
  deck: IDeck;
  onShuffle: () => void;
  onSort: () => void;
  onClear: () => void;
  onReset: () => void;
  onSave: () => void;
}> = ({ deck, onClear, onReset, onSave, onShuffle, onSort }) => {
  const snapEditDeck = useSnapshot(editDeckStore);
  const [deckName, setDeckName] = useState(editDeckStore.deckName);
  const [env, setEnv] = useState(ENV_OCG);
  const [touchDevice, setTouchDevice] = useState(false);

  const handleEnvChange = (value: any) => setEnv(value);

  useEffect(() => {
    iDeckToEditingDeck(deck).then(editDeckStore.set);
    setDeckName(deck.deckName);
  }, [deck]);
  useEffect(() => {
    setTouchDevice(isTouchDevice());
  }, []);
  useEffect(() => {
    editDeckStore.deckName = deckName;
  }, [deckName]);

  const handleSwitchCard = (type: Type, card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isSide = type === "side";
    const targetType = isSide
      ? isExtraDeckCard(cardType)
        ? "extra"
        : "main"
      : "side";
    const { result, reason } = editDeckStore.canAdd(card, targetType, type);
    if (result) {
      editDeckStore.remove(type, card);
      editDeckStore.add(targetType, card);
    } else {
      message.error(reason);
    }
  };

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleMouseUp = (
    type: "main" | "extra" | "side",
    payload: DeckCardMouseUpEvent,
  ) => {
    const { event, card } = payload;
    if (touchDevice) {
      showSelectedCard(card);
      return;
    }
    switch (event.button) {
      // 宸﹂敭
      case 0:
        showSelectedCard(card);
        break;
      // 涓敭
      case 1:
        handleSwitchCard(type, card);
        break;
      // 鍙抽敭
      case 2:
        editDeckStore.remove(type, card);
        break;
      default:
        break;
    }
    event.preventDefault();
  };

  const handleLongPress = (type: "main" | "extra" | "side", card: CardMeta) => {
    editDeckStore.remove(type, card);
  };
  const { t: i18n } = useTranslation("BuildDeck");
  return (
    <div className={styles.container}>
      <Space className={styles.title}>
        <Input
          placeholder={i18n("EnterTheDeckName")}
          variant="borderless"
          prefix={<EditOutlined />}
          style={{ width: "8.8rem" }}
          onChange={(e) => setDeckName(e.target.value)}
          value={deckName}
        />
        <Space style={{ marginRight: "0.4rem" }} size={5}>
          {touchDevice && (
            <span className={styles["touch-hint"]}>
              Tap: preview/add main, long press: remove/add side
            </span>
          )}
          <Select
            title={i18n("Environment")}
            value={env}
            options={[
              {
                value: ENV_OCG,
                label: "OCG",
              },
              {
                value: ENV_408,
                label: "408",
              },
            ]}
            onChange={handleEnvChange}
          />
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            onClick={onShuffle}
          >
            {i18n("Shuffle")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<RetweetOutlined />}
            onClick={onSort}
          >
            {i18n("Sort")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={onClear}
          >
            {i18n("Clear")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UndoOutlined />}
            onClick={() => onReset()}
          >
            {i18n("Reset")}
          </Button>
          <Button
            type={snapEditDeck.edited ? "primary" : "text"}
            size="small"
            icon={<CheckOutlined />}
            onClick={() => onSave()}
          >
            {i18n("Save")}
          </Button>
          <Tooltip title={i18n("QuestionCircleTooltip")}>
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      </Space>
      <ScrollableArea className={styles["deck-zone"]}>
        {(["main", "extra", "side"] as const).map((type) => (
          <DeckZone
            key={type}
            type={type}
            cards={[...snapEditDeck[type]]}
            canAdd={editDeckStore.canAdd}
            onChange={(card, source, destination) => {
              editDeckStore.add(destination, card);
              if (source !== "search") {
                editDeckStore.remove(source, card);
              }
            }}
            onElementMouseUp={(event) => handleMouseUp(type, event)}
            onElementClick={(card) => {
              if (touchDevice) {
                showSelectedCard(card);
              }
            }}
            onElementLongPress={({ type, card }) => {
              if (touchDevice) {
                handleLongPress(type, card);
              }
            }}
            onDoubleClick={(card) => {
              if (editDeckStore.canAdd(card, type, "search").result) {
                editDeckStore.add(type, card);
              }
            }}
            is408={env === ENV_408}
          />
        ))}
      </ScrollableArea>
    </div>
  );
};

const HigherCardDetail: React.FC = () => {
  const { id, open } = useSnapshot(selectedCard);
  return (
    <CardDetail
      open={open}
      code={id}
      onClose={() => (selectedCard.open = false)}
    />
  );
};


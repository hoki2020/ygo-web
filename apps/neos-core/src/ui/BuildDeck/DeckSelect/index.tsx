import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, MenuProps, UploadProps } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import YGOProDeck from "ygopro-deck-encode";

import { deckStore, IDeck } from "@/stores";

import { Uploader } from "../../Shared";
import styles from "./index.module.scss";

export const DeckSelect: React.FC<{
  decks: IDeck[];
  selected: string;
  onSelect: (deckName: string) => any;
  onDelete: (deckName: string) => Promise<any>;
  onDownload: (deckName: string) => any;
  onCopy: (deckName: string) => Promise<any>;
}> = ({ decks, selected, onSelect, onDelete, onDownload, onCopy }) => {
  const newDeck = useRef<IDeck[]>([]);
  const { modal, message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");

  const createNewDeck = async () => {
    const deckName = new Date().toLocaleString();
    await deckStore.add({
      deckName,
      main: [],
      extra: [],
      side: [],
    });
    onSelect(deckName);
  };

  const showUploadModal = () =>
    modal.info({
      width: 600,
      centered: true,
      icon: null,
      content: (
        <DeckUploader
          onLoaded={(deck) => {
            newDeck.current.push(deck);
          }}
        />
      ),
      okText: "Upload",
      maskClosable: true,
      onOk: async () => {
        const results = await Promise.all(
          newDeck.current.map((deck) => deckStore.add(deck)),
        );
        newDeck.current = [];
        if (results.length) {
          results.every(Boolean)
            ? message.success("Upload successful")
            : message.error("Some files failed to upload");
        }
      },
    });

  const importFromClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .readText()
        .then((text) => {
          const deck = YGOProDeck.fromYdkString(text);
          if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
            const deckName = new Date().toLocaleString();
            deckStore
              .add({
                deckName,
                ...deck,
              })
              .then((result) => {
                if (result) {
                  message.success(`Imported: ${deckName}`);
                  onSelect(deckName);
                } else {
                  message.error("Failed to parse clipboard deck");
                }
              });
          } else {
            message.error("Failed to parse clipboard deck");
          }
        })
        .catch(() => {
          message.error("Failed to read clipboard");
        });
    } else {
      message.error("Clipboard API is not supported");
    }
  };

  const items: MenuProps["items"] = [
    {
      label: `${i18n("CreateNewDeck")}`,
      icon: <PlusOutlined />,
      onClick: createNewDeck,
    },
    {
      label: `${i18n("ImportFromLocalFile")}`,
      icon: <FileAddOutlined />,
      onClick: showUploadModal,
    },
    {
      label: `${i18n("ImportFromClipboard")}`,
      icon: <CopyOutlined />,
      onClick: importFromClipboard,
    },
  ].map((item, key) => ({ ...item, key }));

  return (
    <>
      <div className={styles["deck-select"]}>
        {decks.map((deck) => (
          <div
            key={deck.deckName}
            className={styles.item}
            onClick={() => onSelect(deck.deckName)}
          >
            <div className={styles.hover} />
            {selected === deck.deckName && <div className={styles.selected} />}
            <span>{deck.deckName}</span>
            <div className={styles.btns}>
              <button
                type="button"
                className={styles["btn-icon"]}
                onClick={cancelBubble(async () => {
                  const result = await onCopy(deck.deckName);
                  result
                    ? message.success(`${i18n("CopySuccessful")}`)
                    : message.error(`${i18n("CopyFailed")}`);
                })}
              >
                <CopyOutlined />
              </button>
              <button
                type="button"
                className={styles["btn-icon"]}
                onClick={cancelBubble(async () => {
                  await onDelete(deck.deckName);
                  if (decks.length) {
                    onSelect(decks[0].deckName);
                  }
                })}
              >
                <DeleteOutlined />
              </button>
              <button
                type="button"
                className={styles["btn-icon"]}
                onClick={cancelBubble(() => onDownload(deck.deckName))}
              >
                <DownloadOutlined />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dropdown menu={{ items }} placement="top" arrow trigger={["click"]}>
        <Button
          className={styles["btn-add"]}
          icon={<PlusOutlined />}
          shape="circle"
          type="text"
          size="large"
        />
      </Dropdown>
    </>
  );
};

const DeckUploader: React.FC<{ onLoaded: (deck: IDeck) => void }> = ({
  onLoaded,
}) => {
  const [uploadState, setUploadState] = useState("");
  const { message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      if (uploadState !== "ERROR") {
        info.file.status = "done";
      }
    },
    accept: ".ydk",
    beforeUpload(file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const ydk = e.target?.result as string;
        const deck = YGOProDeck.fromYdkString(ydk);

        if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
          onLoaded({ deckName: file.name.replace(/\.ydk/g, ""), ...deck });
        } else {
          message.error(`${file.name} parse failed`);
          setUploadState("ERROR");
        }
      };
    },
  };

  return (
    <Uploader
      {...uploadProps}
      text={i18n("ClickOrDragFilesHereToUpload")}
      hint={i18n("SupportsYdkExtension")}
    />
  );
};

const cancelBubble =
  <T,>(fn: (e: React.SyntheticEvent) => T) =>
  (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    return fn(e);
  };

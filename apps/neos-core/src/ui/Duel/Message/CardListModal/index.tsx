import { DownOutlined } from "@ant-design/icons";
import { Button, Drawer, Space } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, CardType } from "@/stores";
import { YgoCard } from "@/ui/Shared";

import { showCardModal } from "../CardModal";
import styles from "./index.module.scss";

const CARD_WIDTH = "6.25rem";
const DRAWER_WIDTH = "10rem";

// TODO: 显示的位置还需要细细斟酌

const defaultStore = {
  zone: ygopro.CardZone.HAND,
  controller: 0,
  monster: {} as CardType,
  isOpen: false,
  isZone: true,
};

const store = proxy(defaultStore);

export const CardListModal = () => {
  const { zone, monster, isOpen, isZone, controller } = useSnapshot(store);
  let cardList: CardType[] = [];

  if (isZone) {
    cardList = cardStore.at(zone, controller);
  } else {
    // 看超量素材
    cardList = cardStore.findOverlay(
      monster.location.zone,
      monster.location.controller,
      monster.location.sequence,
    );
  }

  const handleOkOrCancel = () => {
    store.isOpen = false;
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleOkOrCancel}
      rootClassName={styles.root}
      className={styles.drawer}
      title={null}
      closable={false}
      width={DRAWER_WIDTH}
      style={{ maxHeight: "100%" }}
      mask={false}
    >
      <div className={styles.container}>
        <Space direction="vertical" className={styles.list}>
          {cardList.map((card) => (
            <YgoCard
              code={card.code}
              key={card.uuid}
              targeted={card.targeted}
              width={CARD_WIDTH}
              onClick={() => showCardModal(card)}
            />
          ))}
        </Space>
        <div className={styles.footer}>
          <Button
            className={styles.collapseBtn}
            icon={<DownOutlined />}
            onClick={handleOkOrCancel}
          >
            收起
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export const displayCardListModal = ({
  isZone,
  monster,
  zone,
  controller,
}: Partial<Omit<typeof defaultStore, "isOpen">>) => {
  store.isOpen = true;
  store.isZone = isZone ?? false;
  monster && (store.monster = monster);
  zone && (store.zone = zone);
  controller !== undefined && (store.controller = controller);
};

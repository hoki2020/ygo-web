import { proxy } from "valtio";

import { deckStore, emptyDeck, type IDeck } from "@/stores";

export const selectedCard = proxy({
  id: 23995346,
  open: false,
});

const selectedDeck = proxy<{ deck: IDeck }>({
  deck: deckStore.decks.at(0) ?? emptyDeck,
});

export const getSelectedDeck = () => selectedDeck;

export const setSelectedDeck = (deck: IDeck) => {
  selectedDeck.deck = deck;
};

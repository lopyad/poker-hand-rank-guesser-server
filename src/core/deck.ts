import { Card, SUITS, RANKS } from './types';

// 표준 52장 카드 덱 생성
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of Object.values(SUITS)) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Fisher-Yates 알고리즘을 사용한 덱 셔플
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as Card, shuffled[i] as Card];
  }
  return shuffled;
}

// 덱에서 카드 n장 분배
export function dealCards(deck: Card[], numCards: number): Card[] {
  if (deck.length < numCards) {
    throw new Error("Not enough cards in the deck to deal.");
  }
  return deck.splice(0, numCards);
}

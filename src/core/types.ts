// 카드 무늬 (Suit)
export const SUITS = {
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣',
  Spades: '♠',
} as const;
export type Suit = typeof SUITS[keyof typeof SUITS];

// 카드 숫자 (Rank)
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof RANKS[number];

// 카드
export interface Card {
  suit: Suit;
  rank: Rank;
}

// 플레이어
export interface Player {
  id: number;
  holeCards: Card[]; // 사용자가 손에 들고 있는 4장의 카드
}

// 게임 상태
export interface GameState {
  players: Player[];
  communityCards: Card[]; // 공유되는 5장의 카드
  deck: Card[];
}

// 포커 핸드 족보 값 (높을수록 강함)
export const HAND_RANK_VALUES = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
} as const;
export type HandRankValue = typeof HAND_RANK_VALUES[keyof typeof HAND_RANK_VALUES];

// 핸드 족보 이름
export const HAND_RANK_NAMES: { [key in HandRankValue]: string } = {
  [HAND_RANK_VALUES.HIGH_CARD]: 'High Card',
  [HAND_RANK_VALUES.PAIR]: 'Pair',
  [HAND_RANK_VALUES.TWO_PAIR]: 'Two Pair',
  [HAND_RANK_VALUES.THREE_OF_A_KIND]: 'Three of a Kind',
  [HAND_RANK_VALUES.STRAIGHT]: 'Straight',
  [HAND_RANK_VALUES.FLUSH]: 'Flush',
  [HAND_RANK_VALUES.FULL_HOUSE]: 'Full House',
  [HAND_RANK_VALUES.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HAND_RANK_VALUES.STRAIGHT_FLUSH]: 'Straight Flush',
  [HAND_RANK_VALUES.ROYAL_FLUSH]: 'Royal Flush',
};

// 핸드 평가 결과
export interface EvaluatedHand {
  rankValue: HandRankValue; // 핸드 족보 값
  rankName: string; // 핸드 족보 이름
  handCards: Card[]; // 핸드를 구성하는 5장의 카드 (정렬된 상태)
  primaryTieBreaker?: Rank; // For Pair, Two Pair (higher), Three of a Kind, Four of a Kind, Full House (trips)
  secondaryTieBreaker?: Rank; // For Two Pair (lower), Full House (pair)
  kickerRanks: Rank[]; // Ranks of kickers, sorted descending
}
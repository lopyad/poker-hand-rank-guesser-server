import type { Player, GameState, Card, EvaluatedHand } from './types';
import { createDeck, shuffleDeck } from './deck';
import { evaluatePlayerHand, compareEvaluatedHands } from './hand-evaluator';

const NUM_PLAYERS = 4;
const HOLE_CARDS_PER_PLAYER = 4;
const COMMUNITY_CARDS = 5;

// 새 게임 시작 및 초기 상태 설정
export function setupNewGame(): GameState {
  const deck = shuffleDeck(createDeck());

  const players: Player[] = [];
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const holeCards = deck.splice(0, HOLE_CARDS_PER_PLAYER);
    players.push({ id: i + 1, holeCards });
  }

  const communityCards = deck.splice(0, COMMUNITY_CARDS);

  return { players, communityCards, deck };
}

export interface PlayerHandResult {
  playerId: number;
  evaluatedHand: EvaluatedHand;
  predictedRank?: number;
  actualRank?: number;
}

// 모든 플레이어의 핸드를 평가하고 순위를 매겨 반환
export function getPlayerHandRanks(gameState: GameState): PlayerHandResult[] {
  const results: PlayerHandResult[] = gameState.players.map(player => {
    const evaluatedHand = evaluatePlayerHand(player.holeCards, gameState.communityCards);
    return {
      playerId: player.id,
      evaluatedHand,
    };
  });

  // 핸드 순위에 따라 플레이어 정렬 (높은 순위가 먼저)
  results.sort((a, b) => compareEvaluatedHands(b.evaluatedHand, a.evaluatedHand));

  return results;
}
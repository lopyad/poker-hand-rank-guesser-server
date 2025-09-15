import { Card, EvaluatedHand, HAND_RANK_VALUES, HAND_RANK_NAMES, Rank, RANKS, type Suit, SUITS } from './types';

const RANK_VALUES: { [key in Rank]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
}

function getCombinations(cards: Card[], combinationLength: number): Card[][] {
    const results: Card[][] = [];
    function combine(currentCombination: Card[], start: number) {
        if (currentCombination.length === combinationLength) {
            results.push([...currentCombination]);
            return;
        }
        if (start >= cards.length) {
            return;
        }
        currentCombination.push(cards[start] as Card);
        combine(currentCombination, start + 1);
        currentCombination.pop();
        combine(currentCombination, start + 1);
    }
    combine([], 0);
    return results;
}

export function evaluatePlayerHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
    const allCards = [...holeCards, ...communityCards];
    const all5CardCombinations = getCombinations(allCards, 5);

    let bestHand: EvaluatedHand | null = null;

    for (const hand of all5CardCombinations) {
        const evaluated = evaluate5CardHand(hand);
        if (!bestHand || compareEvaluatedHands(evaluated, bestHand) > 0) {
            bestHand = evaluated;
        }
    }
    
    if (!bestHand) {
        throw new Error("Could not determine best hand");
    }
    return bestHand;
}

function evaluate5CardHand(hand: Card[]): EvaluatedHand {
    const sortedHand = sortCards(hand);
    const rankCounts: { [key in Rank]?: number } = {};
    const suitCounts: { [key in Suit]?: number } = {};
    let isFlush = false;
    let isStraight = false;

    for (const card of sortedHand) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }

    if (Object.values(suitCounts).some(count => count !== undefined && count >= 5)) {
        isFlush = true;
    }

    const uniqueSortedRanks = sortCards(Object.keys(rankCounts).map(rank => ({ rank: rank as Rank, suit: SUITS.Spades }))).map(c => c.rank);
    if (uniqueSortedRanks.length >= 5) {
        for (let i = 0; i <= uniqueSortedRanks.length - 5; i++) {
            const slice = uniqueSortedRanks.slice(i, i + 5);
            if (RANK_VALUES[slice[0] as Rank] - RANK_VALUES[slice[4] as Rank] === 4) {
                isStraight = true;
                break;
            }
        }
        // Ace-low straight (A-2-3-4-5)
        if (!isStraight) {
            const aceLowRanks = ['A', '5', '4', '3', '2'];
            if (aceLowRanks.every(r => uniqueSortedRanks.includes(r as Rank))) {
                isStraight = true;
            }
        }
    }
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const primaryRank = Object.keys(rankCounts).find(r => rankCounts[r as Rank] === counts[0]) as Rank;
    
    const kickerRanks = sortedHand.map(card => card.rank);

    if (isStraight && isFlush) {
        const flushSuit = Object.keys(suitCounts).find(s => {
            const count = suitCounts[s as Suit];
            return count !== undefined && count >= 5;
        });
        const straightFlushHand = sortedHand.filter(c => c.suit === flushSuit);
        if (RANK_VALUES[primaryRank] === 14) return { rankValue: HAND_RANK_VALUES.ROYAL_FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.ROYAL_FLUSH], handCards: sortedHand, kickerRanks };
        return { rankValue: HAND_RANK_VALUES.STRAIGHT_FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.STRAIGHT_FLUSH], handCards: sortedHand, kickerRanks };
    }
    if (counts[0] === 4) return { rankValue: HAND_RANK_VALUES.FOUR_OF_A_KIND, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FOUR_OF_A_KIND], handCards: sortedHand, primaryTieBreaker: primaryRank, kickerRanks: kickerRanks.filter(r => r !== primaryRank) };
    if (counts[0] === 3 && counts[1] === 2) {
        const tripsRank = Object.keys(rankCounts).find(r => rankCounts[r as Rank] === 3) as Rank;
        const pairRank = Object.keys(rankCounts).find(r => rankCounts[r as Rank] === 2) as Rank;
        return { rankValue: HAND_RANK_VALUES.FULL_HOUSE, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FULL_HOUSE], handCards: sortedHand, primaryTieBreaker: tripsRank, secondaryTieBreaker: pairRank, kickerRanks: [] };
    }
    if (isFlush) return { rankValue: HAND_RANK_VALUES.FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FLUSH], handCards: sortedHand, kickerRanks };
    if (isStraight) return { rankValue: HAND_RANK_VALUES.STRAIGHT, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.STRAIGHT], handCards: sortedHand, kickerRanks };
    if (counts[0] === 3) return { rankValue: HAND_RANK_VALUES.THREE_OF_A_KIND, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.THREE_OF_A_KIND], handCards: sortedHand, primaryTieBreaker: primaryRank, kickerRanks: kickerRanks.filter(r => r !== primaryRank) };
    if (counts[0] === 2 && counts[1] === 2) {
        const pairRanks = Object.keys(rankCounts).filter(r => rankCounts[r as Rank] === 2).sort((a, b) => RANK_VALUES[b as Rank] - RANK_VALUES[a as Rank]) as Rank[];
        const highPair = pairRanks[0];
        const lowPair = pairRanks[1];
        const kicker = Object.keys(rankCounts).find(r => rankCounts[r as Rank] === 1) as Rank;
        return { rankValue: HAND_RANK_VALUES.TWO_PAIR, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.TWO_PAIR], handCards: sortedHand, primaryTieBreaker: highPair, secondaryTieBreaker: lowPair, kickerRanks: [kicker] } as EvaluatedHand;
    }
    if (counts[0] === 2) return { rankValue: HAND_RANK_VALUES.PAIR, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.PAIR], handCards: sortedHand, primaryTieBreaker: primaryRank, kickerRanks: kickerRanks.filter(r => r !== primaryRank) };

    return { rankValue: HAND_RANK_VALUES.HIGH_CARD, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.HIGH_CARD], handCards: sortedHand, kickerRanks };
}

export function compareEvaluatedHands(a: EvaluatedHand, b: EvaluatedHand): number {
    if (a.rankValue !== b.rankValue) {
        return a.rankValue - b.rankValue;
    }

    // If hand ranks are equal, apply hand-specific tie-breaking rules
    switch (a.rankValue) {
        case HAND_RANK_VALUES.ROYAL_FLUSH:
        case HAND_RANK_VALUES.STRAIGHT_FLUSH:
        case HAND_RANK_VALUES.STRAIGHT:
        case HAND_RANK_VALUES.FLUSH:
        case HAND_RANK_VALUES.HIGH_CARD:
            // For these hands, compare kickers (all 5 cards) in order
            for (let i = 0; i < a.kickerRanks.length; i++) {
                const diff = RANK_VALUES[a.kickerRanks[i] as Rank] - RANK_VALUES[b.kickerRanks[i] as Rank];
                if (diff !== 0) {
                    return diff;
                }
            }
            break;
        case HAND_RANK_VALUES.FOUR_OF_A_KIND:
            // Compare the rank of the four-of-a-kind first
            let diff = RANK_VALUES[a.primaryTieBreaker!] - RANK_VALUES[b.primaryTieBreaker!];
            if (diff !== 0) return diff;
            // Then compare the kicker
            diff = RANK_VALUES[a.kickerRanks[0] as Rank] - RANK_VALUES[b.kickerRanks[0] as Rank];
            if (diff !== 0) return diff;
            break;
        case HAND_RANK_VALUES.FULL_HOUSE:
            // Compare the rank of the three-of-a-kind first
            let diffTrips = RANK_VALUES[a.primaryTieBreaker!] - RANK_VALUES[b.primaryTieBreaker!];
            if (diffTrips !== 0) return diffTrips;
            // Then compare the rank of the pair
            let diffPair = RANK_VALUES[a.secondaryTieBreaker!] - RANK_VALUES[b.secondaryTieBreaker!];
            if (diffPair !== 0) return diffPair;
            break;
        case HAND_RANK_VALUES.THREE_OF_A_KIND:
            // Compare the rank of the three-of-a-kind first
            let diffTripsOnly = RANK_VALUES[a.primaryTieBreaker!] - RANK_VALUES[b.primaryTieBreaker!];
            if (diffTripsOnly !== 0) return diffTripsOnly;
            // Then compare kickers
            for (let i = 0; i < a.kickerRanks.length; i++) {
                const diffKicker = RANK_VALUES[a.kickerRanks[i] as Rank] - RANK_VALUES[b.kickerRanks[i] as Rank];
                if (diffKicker !== 0) {
                    return diffKicker;
                }
            }
            break;
        case HAND_RANK_VALUES.TWO_PAIR:
            // Compare the higher pair first
            let diffHighPair = RANK_VALUES[a.primaryTieBreaker!] - RANK_VALUES[b.primaryTieBreaker!];
            if (diffHighPair !== 0) return diffHighPair;
            // Then compare the lower pair
            let diffLowPair = RANK_VALUES[a.secondaryTieBreaker!] - RANK_VALUES[b.secondaryTieBreaker!];
            if (diffLowPair !== 0) return diffLowPair;
            // Then compare the kicker
            let diffTwoPairKicker = RANK_VALUES[a.kickerRanks[0] as Rank] - RANK_VALUES[b.kickerRanks[0] as Rank];
            if (diffTwoPairKicker !== 0) return diffTwoPairKicker;
            break;
        case HAND_RANK_VALUES.PAIR:
            // Compare the pair first
            let diffPairOnly = RANK_VALUES[a.primaryTieBreaker!] - RANK_VALUES[b.primaryTieBreaker!];
            if (diffPairOnly !== 0) return diffPairOnly;
            // Then compare kickers
            for (let i = 0; i < a.kickerRanks.length; i++) {
                const diffKickerPair = RANK_VALUES[a.kickerRanks[i] as Rank] - RANK_VALUES[b.kickerRanks[i] as Rank];
                if (diffKickerPair !== 0) {
                    return diffKickerPair;
                }
            }
            break;
    }

    return 0;
}
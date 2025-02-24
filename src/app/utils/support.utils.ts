import { CHESS_COLOR, CHESS_COLORS, LUDO_COLOR, LUDO_COLORS, PLAYER_COLOR } from "../config";

export function shortenName(name: string) {
    // Trim whitespace and split the name into parts
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        // If it's a single word, return the first 2 or 3 letters
        const singleWord = parts[0];
        return singleWord.length > 2 ? singleWord.substring(0, 3).toUpperCase() : singleWord.toUpperCase();
    } else {
        // For multiple words, combine the first letter of the first word
        // with the first letter of the last word
        return (
            parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        );
    }
}

export function isLudoColor(color?: PLAYER_COLOR): color is LUDO_COLOR {
    return color != undefined && LUDO_COLORS.indexOf(color as LUDO_COLOR) > -1
}

export function isChessColor(color?: PLAYER_COLOR): color is CHESS_COLOR {
    return color != undefined && CHESS_COLORS.indexOf(color as CHESS_COLOR) > -1
}

export function generateRandomNumbers(n: number, useCrypto = false): number[] {
    const randomNumbers: number[] = [];

    for (let i = 0; i < n; i++) {
        if (useCrypto && window.crypto && window.crypto.getRandomValues) {
            // Use Web Crypto API for true randomness
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            randomNumbers.push(array[0] / 4294967295); // Normalize to 0-1
        } else {
            // Fallback to Math.random()
            randomNumbers.push(Math.random());
        }
    }

    return randomNumbers;
}
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
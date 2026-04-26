const BANNED_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "piss", "cock",
  "dick", "pussy", "motherfucker", "fucker", "bullshit", "jackass", "dumbass",
  "fag", "retard", "whore", "slut", "nigger", "nigga",
  "chutiya", "madarchod", "bhenchod", "gaandu", "harami", "kamina",
  "bhosdike", "maderchod", "lund", "randi",
];

export function filterProfanity(text: string): string {
  let result = text;
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, (match) => "*".repeat(match.length));
  }
  return result;
}

export function containsProfanity(text: string): boolean {
  return BANNED_WORDS.some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text)
  );
}

//These functions detect messages and return if they are suspicious and why they are.
/*The functions has a rating threshold of 6 and 
if the message has elements that are equal or greater than 6, it's suspicious*/

export interface AnalysisResult {
  score: number
  suspicious: boolean
  reasons: string[]
}

export function analyzeMessage(message: string): AnalysisResult {
  let score = 0
  const reasons: string[] = []
  const text = message.toLowerCase()

  if (text.includes("sell individually")) {
    score += 2
    reasons.push("uses sell individually language")
  }

  if (
    text.includes("sell") &&
    text.includes("ticket")
  ) {
    score += 2
    reasons.push("mentions selling tickets")
  }

  if (
    text.includes("dm me") ||
    text.includes("message me") ||
    text.includes("text me") ||
    text.includes("hmu")
  ) {
    score += 1
    reasons.push("asks for private contact")
  }

  const phonePattern =
    /(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/

  if (phonePattern.test(text)) {
    score += 1
    reasons.push("contains phone number")
  }

  const moneyPromisePattern = /\b(earn|make|win|get paid)\b.{0,35}\$\s?\d+/i
  const aggressiveCallToActionPattern = /\b(click (this|the) link|claim (your|a)|act now|limited time|guaranteed payment)\b/i

  if (moneyPromisePattern.test(text)) {
    score += 3
    reasons.push("promises fast or easy money")
  }

  if (aggressiveCallToActionPattern.test(text)) {
    score += 2
    reasons.push("uses a high-pressure link or claim prompt")
  }

  if (
    (moneyPromisePattern.test(text) || aggressiveCallToActionPattern.test(text)) &&
    /\b(today|right now|immediately|urgent)\b/i.test(text)
  ) {
    score += 1
    reasons.push("adds urgency to the offer")
  }

  const opponents = [
    "auburn",
    "missouri",
    "georgia tech",
    "alabama",
    "bama",
    "oklahoma"
  ]

  const gamesMentioned = opponents.filter(opponent =>
    text.includes(opponent)
  )

  if (gamesMentioned.length >= 2) {
    score += 2
    reasons.push("mentions multiple games")
  }

  const quantityGamePattern =
    /\b\d+\s+(auburn|missouri|georgia tech|alabama|bama|oklahoma)\b/g

  const quantityGameMatches = text.match(quantityGamePattern)

  if (quantityGameMatches && quantityGameMatches.length >= 2) {
    score += 2
    reasons.push("lists quantities for multiple games")
  }

  return {
    score,
    suspicious: score >= 6,
    reasons
  }
}

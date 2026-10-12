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

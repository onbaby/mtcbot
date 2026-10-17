import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { analyzeMessage } from "../src/detector.js"

describe("analyzeMessage", () => {
  const cases = [
    {
      name: "flags a bulk ticket seller with a phone number",
      text: "I'm selling 3 Auburn, 3 Missouri and 3 Georgia Tech tickets, I can sell individually 224-231-7380",
      expected: true
    },
    {
      name: "flags multiple ticket listings that request a DM",
      text: "Selling 2 Bama and 2 Oklahoma tickets, DM me if you're interested.",
      expected: true
    },
    {
      name: "flags a high-pressure easy-money message",
      text: "Earn $500 today! Click this link to claim your payment now!",
      expected: true
    },
    {
      name: "allows a single ticket listing",
      text: "Selling one Georgia ticket. DM me if interested.",
      expected: false
    },
    {
      name: "allows a parking-pass listing",
      text: "I'm selling my parking pass. Message me if you're interested.",
      expected: false
    },
    {
      name: "allows a club application link",
      text: "Join MTC now! Apply here: https://forms.gle/example",
      expected: false
    },
    {
      name: "allows an event announcement with contact information",
      text: "Movie screening of Harar: The Forgotten Islamic City. Nov 2nd / 2-5PM. Tickets $10. Get your tickets online with Eventbrite at https://tinyurl.com/4faw4zpv. For more information contact Br Wahib at (678) 499-4469. Zelle info available upon request.",
      expected: false
    },
    {
      name: "allows a normal scholarship announcement",
      text: "The scholarship application closes today. Visit the student center website for details.",
      expected: false
    }
  ]

  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = analyzeMessage(testCase.text)
      assert.equal(result.suspicious, testCase.expected)
    })
  }

  it("reports the signals that contributed to the score", () => {
    const result = analyzeMessage(
      "Selling 2 Bama and 2 Oklahoma tickets, DM me if you're interested."
    )

    assert.equal(result.score, 7)
    assert.deepEqual(result.reasons, [
      "mentions selling tickets",
      "asks for private contact",
      "mentions multiple games",
      "lists quantities for multiple games"
    ])
  })
})

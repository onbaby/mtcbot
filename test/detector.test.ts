import { analyzeMessage } from "../src/detector.js"

//the test messages
const testMessages = [
  {
    text: "I'm selling 3 Auburn, 3 Missouri and 3 Georgia Tech tickets, I can sell individually 224-231-7380",
    expected: true
  },
  {
    text: "Selling 2 Bama and 2 Oklahoma tickets, DM me if you're interested.",
    expected: true
  },
  {
    text: "Selling one Georgia ticket. DM me if interested.",
    expected: false
  },
  {
    text: "I'm selling my parking pass. Message me if you're interested.",
    expected: false
  },
  {
    text: "Join MTC now! Apply here: https://forms.gle/example",
    expected: false
  },
  {
    text: "Movie screening of Harar: The Forgotten Islamic City. Nov 2nd / 2-5PM. Tickets $10. Get your tickets online with Eventbrite at https://tinyurl.com/4faw4zpv. For more information contact Br Wahib at (678) 499-4469. Zelle info available upon request.",
    expected: false
  }
]

//the loop to actually run the tests
for (const test of testMessages) {
  const result = analyzeMessage(test.text)

  console.log({
    expected: test.expected,
    actual: result.suspicious,
    score: result.score,
    reasons: result.reasons
  })
}
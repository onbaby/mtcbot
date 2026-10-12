# MTC Bot

A small GroupMe ticket-scam detector with an interactive browser demo.

## Run locally

```bash
npm install
npm start
```

Open <http://localhost:3000>. For development with automatic server restarts, use
`npm run dev`. Run the type check and test suite with `npm run check` and `npm test`.

The detector is intentionally conservative. It combines ticket-sale language,
private-contact requests, phone numbers, opponent names, and bulk quantities into
a score. A message is marked suspicious at a score of 6 or higher.

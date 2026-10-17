# MTC Bot

A working GroupMe warning bot and interactive scam detector.

## What works

- Local, privacy-friendly message analysis with no upload or account required
- Ticket-sale and high-pressure easy-money scam signals
- Built-in suspicious and safe examples
- Clear/reset, live character count, detailed reasons, and copyable results
- Responsive, keyboard-accessible interface with reduced-motion support
- Real GroupMe installation flow: enter a developer token, choose a group, and create the bot
- Live GroupMe callback that checks incoming messages and posts a warning for suspicious content
- Encrypted, tamper-resistant installation tokens; no browser storage or database required

GroupMe's public bot API can receive messages and post warnings, but does not
provide an endpoint for deleting another member's message. MTC Bot therefore
alerts the group immediately and leaves message removal to a group admin.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Replace `INSTALLATION_SECRET` with a long random value before starting. You can
generate one with `openssl rand -hex 32`. `PUBLIC_BASE_URL` is optional; it is
derived from the request host when omitted.

Open <http://localhost:3000>. For development with automatic server restarts, use
`npm run dev`. Run the type check and test suite with `npm run check` and `npm test`.

## Deploy to Vercel

Import this repository in Vercel and leave the detected settings unchanged. The
included `vercel.json` runs `npm run build` and publishes the self-contained `dist`
directory. You can also deploy with the Vercel CLI by running `vercel` from this
folder.

Add an `INSTALLATION_SECRET` environment variable to Production, Preview, and
Development in Vercel, then redeploy. No GroupMe token belongs in Vercel: each
admin supplies their own token during installation, and it is encrypted into
that bot's callback URL using the server-side secret.

## How installation works

1. The site uses the admin's GroupMe token to list groups they can access.
2. After a group is chosen, the server creates an official GroupMe bot whose
   callback points back to `/api/groupme/callback`.
3. GroupMe sends new group messages to the callback. MTC Bot ignores bot/system
   messages, runs the detector, and posts a warning when the score reaches the
   suspicious threshold.

If `INSTALLATION_SECRET` changes, existing callback tokens can no longer be
opened and those bots must be reinstalled.

The detector is intentionally conservative. It combines ticket-sale language,
private-contact requests, phone numbers, opponent names, and bulk quantities into
a score. A message is marked suspicious at a score of 6 or higher.

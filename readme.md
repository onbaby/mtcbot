# MTC Bot

A working GroupMe warning bot and interactive scam detector.

## What works

- Local, privacy-friendly message analysis with no upload or account required
- Ticket-sale and high-pressure easy-money scam signals
- Built-in suspicious and safe examples
- Clear/reset, live character count, detailed reasons, and copyable results
- Responsive, keyboard-accessible interface with reduced-motion support
- GroupMe OAuth login: users sign in on GroupMe, return, choose a group, and create the bot
- Live GroupMe callback that checks incoming messages, attempts deletion, and posts a result
- Encrypted, tamper-resistant installation tokens; no browser storage or database required

GroupMe's documented public bot API can receive messages and post warnings. MTC
Bot also attempts the undocumented `DELETE /conversations/:group/messages/:message`
route used by older moderation bots. When that route is unavailable or the
installer lacks permission, MTC Bot posts a warning and leaves removal to an
admin. Treat deletion as experimental rather than guaranteed behavior.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Replace `INSTALLATION_SECRET` with a long random value before starting. You can
generate one with `openssl rand -hex 32`. Create a GroupMe application and set
`GROUPME_CLIENT_ID` to its client ID. Its callback URL must be
`https://YOUR_BACKEND/api/groupme/oauth`. `PUBLIC_BASE_URL` is optional; it is
derived from the request host when omitted. `APP_URL` controls where OAuth sends
the user after a successful login.

Open <http://localhost:3000>. For development with automatic server restarts, use
`npm run dev`. Run the type check and test suite with `npm run check` and `npm test`.

## Deploy to Vercel

Import this repository in Vercel and leave the detected settings unchanged. The
included `vercel.json` runs `npm run build` and publishes the self-contained `dist`
directory. You can also deploy with the Vercel CLI by running `vercel` from this
folder.

Add `INSTALLATION_SECRET`, `GROUPME_CLIENT_ID`, and `APP_URL` environment
variables to Production, Preview, and Development in Vercel, then redeploy. No
GroupMe token belongs in Vercel configuration: OAuth returns each user's token,
and MTC Bot encrypts it before returning a short-lived session to the browser or
placing it in that bot's callback URL.

## How installation works

1. The admin signs in on GroupMe. MTC Bot validates the OAuth result and returns
   an encrypted 24-hour browser session without exposing the raw token.
2. The site uses that authenticated session to list groups they can access.
3. After a group is chosen, the server creates an official GroupMe bot whose
   callback points back to `/api/groupme/callback`.
4. GroupMe sends new group messages to the callback. MTC Bot ignores bot/system
   messages, runs the detector, and attempts to delete messages that reach the
   suspicious threshold. It reports a removal when successful and falls back to
   a warning when deletion is rejected.

If `INSTALLATION_SECRET` changes, existing callback tokens can no longer be
opened and those bots must be reinstalled.

The detector is intentionally conservative. It combines ticket-sale language,
private-contact requests, phone numbers, opponent names, and bulk quantities into
a score. A message is marked suspicious at a score of 6 or higher.

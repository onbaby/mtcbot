import assert from "node:assert/strict"
import test from "node:test"

import {
  analyzeCallback,
  createBot,
  deleteGroupMessage,
  formatWarning,
  listGroups,
  openInstallation,
  postBotMessage,
  sealInstallation
} from "../src/groupme.js"

const secret = "test-secret-that-is-at-least-thirty-two-characters"

test("installation tokens round-trip and reject tampering", () => {
  const token = sealInstallation({ accessToken: "abc", groupId: "123", installedAt: 42 }, secret)
  assert.deepEqual(openInstallation(token, secret), { accessToken: "abc", groupId: "123", installedAt: 42 })
  const parts = token.split(".")
  parts[1] = `${parts[1]?.startsWith("A") ? "B" : "A"}${parts[1]?.slice(1)}`
  assert.throws(() => openInstallation(parts.join("."), secret))
})

test("callback analysis ignores bot and system messages", () => {
  assert.equal(analyzeCallback({ sender_type: "bot", text: "Earn $500 now" }), null)
  assert.equal(analyzeCallback({ system: true, text: "Earn $500 now" }), null)
  assert.equal(analyzeCallback({ text: "   " }), null)
})

test("callback analysis flags a high-pressure payment scam", () => {
  const result = analyzeCallback({ name: "Jean", text: "Earn $500 today! Click this link to claim your payment now!" })
  assert.equal(result?.suspicious, true)
  assert.match(formatWarning({ name: "Jean" }, result!), /Jean's message matched/)
})

test("GroupMe helpers send the expected API requests", async () => {
  const requests: Array<{ url: string; init: RequestInit | undefined }> = []
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input)
    requests.push({ url, init })
    if (url.includes("/groups?")) {
      return new Response(JSON.stringify({ response: [{ id: "1", name: "MSA" }] }), { status: 200 })
    }
    if (url.includes("/conversations/") && init?.method === "DELETE") {
      return new Response(null, { status: 204 })
    }
    if (url.endsWith("/bots") && init?.method === "POST") {
      return new Response(JSON.stringify({ response: { bot: { bot_id: "b1", group_id: "1", name: "MTC Bot" } } }), { status: 201 })
    }
    return new Response(JSON.stringify({ response: {} }), { status: 202 })
  }

  assert.deepEqual(await listGroups("token", fetcher), [{ id: "1", name: "MSA" }])
  assert.equal((await createBot("token", "1", "https://example.com/callback", fetcher)).bot_id, "b1")
  assert.deepEqual(await deleteGroupMessage("token", "1", "m1", fetcher), { deleted: true, status: 204 })
  await postBotMessage("b1", "warning", fetcher)

  assert.equal(new Headers(requests[0]?.init?.headers).get("X-Access-Token"), "token")
  assert.match(String(requests[1]?.init?.body), /callback_url/)
  assert.equal(requests[2]?.init?.method, "DELETE")
  assert.equal(new Headers(requests[2]?.init?.headers).get("X-Access-Token"), "token")
  assert.match(String(requests[3]?.init?.body), /warning/)
})

test("message deletion fails closed so the callback can warn instead", async () => {
  const fetcher: typeof fetch = async () => new Response(null, { status: 403 })
  assert.deepEqual(await deleteGroupMessage("token", "1", "m1", fetcher), { deleted: false, status: 403 })
})

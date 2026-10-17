import { createElement } from "react"
import { createRoot } from "react-dom/client"

import PatternWaves from "./PatternWaves.js"
import { analyzeMessage } from "./detector.js"
import { initGridMotion } from "./gridMotion.js"

const wavesRoot = document.querySelector<HTMLElement>("#pattern-waves-root")
if (wavesRoot) {
  createRoot(wavesRoot).render(
    createElement(PatternWaves as unknown as React.ComponentType<Record<string, unknown>>, {
      preset: "silk",
      color: "#d40000",
      backgroundColor: "#000000",
      fade: "edges",
      interactive: false,
      cursorSize: 50,
      cursorStrength: 0.6,
      pattern: "square",
      opacity: 0.68
    })
  )
}

const gridRoot = document.querySelector<HTMLElement>("#community-grid")
if (gridRoot) initGridMotion(gridRoot)

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
const revealTargets = document.querySelectorAll<HTMLElement>(
  ".section-header, .install-card, .step, .checker-copy, .checker-card, .demo-header, .phone, .community-content"
)

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach(element => element.classList.add("is-visible"))
} else {
  revealTargets.forEach((element, index) => {
    element.classList.add("reveal-in")
    element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 90}ms`)
  })

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add("is-visible")
      revealObserver.unobserve(entry.target)
    })
  }, { threshold: 0.12, rootMargin: "0px 0px -8%" })

  revealTargets.forEach(element => revealObserver.observe(element))
}

const navigation = document.querySelector<HTMLElement>("nav")
if (navigation) {
  let previousScroll = window.scrollY
  let scheduled = false

  const updateNavigation = () => {
    const currentScroll = window.scrollY
    const delta = currentScroll - previousScroll

    if (currentScroll < 40 || delta < -4) {
      navigation.classList.remove("nav-hidden")
    } else if (currentScroll > 120 && delta > 4) {
      navigation.classList.add("nav-hidden")
    }

    previousScroll = currentScroll
    scheduled = false
  }

  window.addEventListener("scroll", () => {
    if (!scheduled) {
      scheduled = true
      requestAnimationFrame(updateNavigation)
    }
  }, { passive: true })
}

const form = document.querySelector<HTMLFormElement>("#message-checker")
const messageInput = document.querySelector<HTMLTextAreaElement>("#message-input")
const resultPanel = document.querySelector<HTMLElement>("#analysis-result")
const messageCount = document.querySelector<HTMLElement>("#message-count")
const exampleButtons = document.querySelectorAll<HTMLButtonElement>("[data-example]")

if (!form || !messageInput || !resultPanel || !messageCount) {
  throw new Error("Message checker markup is missing")
}

const examples = {
  scam: "Selling 2 Bama and 2 Oklahoma tickets, DM me if you're interested.",
  safe: "Reminder: our MSA meeting starts at 7 tonight in the student center."
} as const

const resetResult = () => {
  resultPanel.className = "analysis-result is-empty"
  resultPanel.textContent = "Your result will appear here."
}

const updateCount = () => {
  messageCount.textContent = `${messageInput.value.length} / ${messageInput.maxLength}`
}

messageInput.addEventListener("input", updateCount)

exampleButtons.forEach(button => {
  button.addEventListener("click", () => {
    const example = button.dataset.example as keyof typeof examples | undefined
    if (!example) return
    messageInput.value = examples[example]
    updateCount()
    resetResult()
    messageInput.focus()
  })
})

form.addEventListener("reset", () => {
  requestAnimationFrame(() => {
    updateCount()
    resetResult()
    messageInput.focus()
  })
})

form.addEventListener("submit", (event) => {
  event.preventDefault()

  const message = messageInput.value.trim()
  if (!message) {
    resultPanel.className = "analysis-result is-empty"
    resultPanel.textContent = "Enter a message to check."
    messageInput.focus()
    return
  }

  const result = analyzeMessage(message)
  resultPanel.className = `analysis-result ${result.suspicious ? "is-spam" : "is-safe"}`

  const summary = document.createElement("div")
  summary.className = "result-summary"

  const heading = document.createElement("strong")
  heading.textContent = result.suspicious
    ? "Likely spam or scam"
    : "No high-risk pattern found"

  const score = document.createElement("span")
  score.className = "result-score"
  score.textContent = `${result.score} risk point${result.score === 1 ? "" : "s"}`
  summary.append(heading, score)

  const meter = document.createElement("div")
  meter.className = "risk-meter"
  meter.setAttribute("aria-label", `Risk score ${result.score}; messages are flagged at 6 points`)

  const meterFill = document.createElement("span")
  meterFill.style.width = `${Math.min(100, (result.score / 6) * 100)}%`
  meter.appendChild(meterFill)

  const details = document.createElement("p")
  details.textContent = result.suspicious
    ? "Treat this message cautiously and verify the sender before anyone responds or pays."
    : "This message does not match the detector's high-risk ticket-selling pattern."

  const reasons = document.createElement("ul")
  reasons.className = "result-reasons"
  const signals = result.reasons.length ? result.reasons : ["no suspicious ticket-selling signals detected"]
  signals.forEach(reason => {
    const item = document.createElement("li")
    item.textContent = reason
    reasons.appendChild(item)
  })

  const copyButton = document.createElement("button")
  copyButton.type = "button"
  copyButton.className = "result-copy"
  copyButton.textContent = "Copy result"
  copyButton.addEventListener("click", async () => {
    const verdict = result.suspicious ? "Likely spam or scam" : "No high-risk pattern found"
    const report = `${verdict} (${result.score} risk points). Signals: ${signals.join(", ")}.`

    try {
      await navigator.clipboard.writeText(report)
      copyButton.textContent = "Copied"
    } catch {
      copyButton.textContent = "Copy unavailable"
    }

    setTimeout(() => { copyButton.textContent = "Copy result" }, 1800)
  })

  resultPanel.replaceChildren(summary, meter, details, reasons, copyButton)
})

updateCount()

const installer = document.querySelector<HTMLFormElement>("#groupme-installer")
const loginLink = document.querySelector<HTMLAnchorElement>("#groupme-login")
const profilePanel = document.querySelector<HTMLElement>("#groupme-profile")
const userName = document.querySelector<HTMLElement>("#groupme-user-name")
const logoutButton = document.querySelector<HTMLButtonElement>("#groupme-logout")
const groupSelect = document.querySelector<HTMLSelectElement>("#group-select")
const installButton = document.querySelector<HTMLButtonElement>("#install-bot")
const installStatus = document.querySelector<HTMLElement>("#install-status")

const groupMeApiBase = window.location.hostname === "mtcbot.vercel.app"
  ? "https://mtc-iota-opal.vercel.app"
  : ""
const sessionStorageKey = "mtc-groupme-session"

const readOAuthReturn = (): { session?: string; error?: string } => {
  const parts = window.location.hash.slice(1).split("&")
  const parameters = new URLSearchParams(parts.slice(1).join("&"))
  const session = parameters.get("session") ?? undefined
  const error = parameters.get("error") ?? undefined
  if (session || error) history.replaceState(null, "", "#install")
  return { ...(session ? { session } : {}), ...(error ? { error } : {}) }
}

const getSession = (): string => {
  try { return sessionStorage.getItem(sessionStorageKey) ?? "" } catch { return "" }
}

const saveSession = (session: string): void => {
  try { sessionStorage.setItem(sessionStorageKey, session) } catch { /* Browser storage may be unavailable. */ }
}

const clearSession = (): void => {
  try { sessionStorage.removeItem(sessionStorageKey) } catch { /* Browser storage may be unavailable. */ }
}

const requestJson = async <T>(path: string, body: object): Promise<T> => {
  const session = getSession()
  const response = await fetch(`${groupMeApiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session}` } : {})
    },
    body: JSON.stringify(body)
  })
  const payload = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
  return payload
}

if (installer && loginLink && profilePanel && userName && logoutButton && groupSelect && installButton && installStatus) {
  loginLink.href = `${groupMeApiBase}/api/groupme/login`

  const setInstallerStatus = (message: string, state = "") => {
    installStatus.textContent = message
    installStatus.className = `install-status${state ? ` is-${state}` : ""}`
  }

  const resetInstaller = () => {
    profilePanel.hidden = true
    loginLink.hidden = false
    groupSelect.disabled = true
    groupSelect.replaceChildren(new Option("Sign in to load your groups", ""))
    installButton.disabled = true
    installButton.textContent = "Add MTC Bot"
  }

  const loadGroups = async () => {
    setInstallerStatus("Loading your GroupMe groups…")
    try {
      const payload = await requestJson<{ groups: Array<{ id: string; name: string }> }>("/api/groupme/groups", {})
      groupSelect.replaceChildren(new Option("Choose a group", ""))
      payload.groups.forEach(group => groupSelect.add(new Option(group.name, group.id)))
      groupSelect.disabled = false
      installButton.disabled = true
      setInstallerStatus(payload.groups.length ? "Choose the group you want to protect." : "No groups were found for this account.", payload.groups.length ? "ready" : "error")
    } catch (error) {
      setInstallerStatus(error instanceof Error ? error.message : "Could not load your groups.", "error")
    }
  }

  const restoreSession = async () => {
    const oauthReturn = readOAuthReturn()
    if (oauthReturn.session) saveSession(oauthReturn.session)
    if (oauthReturn.error) {
      clearSession()
      resetInstaller()
      setInstallerStatus(oauthReturn.error, "error")
      return
    }
    if (!getSession()) return

    setInstallerStatus("Confirming your GroupMe login…")
    try {
      const payload = await requestJson<{ user: { name: string } }>("/api/groupme/me", {})
      userName.textContent = payload.user.name
      profilePanel.hidden = false
      loginLink.hidden = true
      await loadGroups()
    } catch (error) {
      clearSession()
      resetInstaller()
      setInstallerStatus(error instanceof Error ? error.message : "Please sign in again.", "error")
    }
  }

  logoutButton.addEventListener("click", () => {
    clearSession()
    resetInstaller()
    setInstallerStatus("Signed out. Connect GroupMe when you are ready.")
  })

  groupSelect.addEventListener("change", () => {
    installButton.disabled = !groupSelect.value
  })

  installer.addEventListener("submit", async event => {
    event.preventDefault()
    const groupId = groupSelect.value
    if (!getSession() || !groupId) return

    installButton.disabled = true
    installButton.textContent = "Installing…"
    setInstallerStatus("Creating MTC Bot in your group…")

    try {
      const payload = await requestJson<{ group: { name: string } }>("/api/groupme/install", { groupId })
      groupSelect.disabled = true
      setInstallerStatus(`MTC Bot is active in ${payload.group.name}. Send a test message to try it.`, "success")
      installButton.textContent = "Bot installed"
    } catch (error) {
      installButton.disabled = false
      installButton.textContent = "Add MTC Bot"
      setInstallerStatus(error instanceof Error ? error.message : "Could not install the bot.", "error")
    }
  })

  void restoreSession()
}

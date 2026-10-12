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

if (!form || !messageInput || !resultPanel) {
  throw new Error("Message checker markup is missing")
}

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

  const heading = document.createElement("strong")
  heading.textContent = result.suspicious
    ? `Likely spam · score ${result.score}/6+`
    : `No high-risk pattern · score ${result.score}/6`

  const details = document.createElement("p")
  details.textContent = result.reasons.length
    ? result.reasons.join(" · ")
    : "No suspicious ticket-selling signals were found."

  resultPanel.replaceChildren(heading, details)
})

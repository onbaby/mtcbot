type GridItem = string | { src: string; alt: string; position?: string }

const items: GridItem[] = [
  { src: "/assets/community/community-celebration.jpg", alt: "Students celebrating together", position: "50% 48%" },
  { src: "/assets/community/campus-library.jpg", alt: "Students walking through a campus library", position: "50% 58%" },
  { src: "/assets/community/student-collaboration.jpg", alt: "Students collaborating around a table", position: "48% 52%" },
  { src: "/assets/community/community-discussion.jpg", alt: "Students participating in a group discussion", position: "55% 48%" },
  { src: "/assets/community/community-celebration.jpg", alt: "A lively student community event", position: "24% 50%" },
  { src: "/assets/community/community-discussion.jpg", alt: "An engaged community conversation", position: "74% 48%" }
]

const makeTile = (item: GridItem, index: number): HTMLElement => {
  const tile = document.createElement("div")
  tile.className = `grid-motion__tile grid-motion__tile--${(index % 4) + 1}`

  if (typeof item === "string") {
    const text = document.createElement("span")
    text.className = "grid-motion__text"
    text.textContent = item
    tile.appendChild(text)
  } else {
    tile.classList.add("grid-motion__tile--image")
    const image = document.createElement("img")
    image.src = item.src
    image.alt = item.alt
    image.decoding = "async"
    image.draggable = false
    image.style.objectPosition = item.position ?? "center"
    tile.appendChild(image)
  }

  return tile
}

export function initGridMotion(root: HTMLElement): () => void {
  const plane = document.createElement("div")
  plane.className = "grid-motion__plane"

  const rows = Array.from({ length: 4 }, (_, rowIndex) => {
    const row = document.createElement("div")
    row.className = "grid-motion__row"

    const sequence = Array.from({ length: 12 }, (_, index) =>
      items[(rowIndex * 3 + index) % items.length]!
    )

    for (const item of [...sequence, ...sequence]) {
      row.appendChild(makeTile(item, row.childElementCount + rowIndex))
    }

    plane.appendChild(row)
    return row
  })

  root.appendChild(plane)

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const compact = window.matchMedia("(max-width: 700px)").matches
  const driftSpeed = compact ? 9 : 20
  const offsets = rows.map((_, index) => index * 73)
  let pointer = 0
  let pointerTarget = 0
  let frame = 0
  let visible = true
  let previous = performance.now()

  const onPointerMove = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    pointerTarget = rect.width ? x / rect.width - 0.5 : 0
    root.style.setProperty("--spot-x", `${x}px`)
    root.style.setProperty("--spot-y", `${event.clientY - rect.top}px`)
  }

  const animate = (now: number) => {
    frame = 0
    const delta = Math.min(0.05, (now - previous) / 1000)
    previous = now
    pointer += (pointerTarget - pointer) * (1 - Math.exp(-delta / 0.3))

    rows.forEach((row, index) => {
      const period = row.scrollWidth / 2
      if (!period) return
      const direction = index % 2 === 0 ? -1 : 1
      const currentOffset = offsets[index] ?? 0
      const nextOffset = reduceMotion ? currentOffset : currentOffset + driftSpeed * direction * delta
      offsets[index] = nextOffset
      const wrapped = ((nextOffset % period) + period) % period
      const base = direction < 0 ? -wrapped : wrapped - period
      const parallax = pointer * 70 * (index % 2 === 0 ? -1 : 1)
      row.style.transform = `translate3d(${(base + parallax).toFixed(2)}px, 0, 0)`
    })

    if (visible && !reduceMotion) frame = requestAnimationFrame(animate)
  }

  const visibility = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting)
    if (visible && !frame && !reduceMotion) {
      previous = performance.now()
      frame = requestAnimationFrame(animate)
    }
  })

  root.addEventListener("pointermove", onPointerMove, { passive: true })
  visibility.observe(root)
  frame = requestAnimationFrame(animate)

  return () => {
    cancelAnimationFrame(frame)
    visibility.disconnect()
    root.removeEventListener("pointermove", onPointerMove)
    plane.remove()
  }
}

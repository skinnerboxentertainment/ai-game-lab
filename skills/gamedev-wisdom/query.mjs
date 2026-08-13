import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CATALOG_PATH = path.join(__dirname, "catalog.json")

function load() {
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"))
  return raw.units
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/[\s-]+/).filter(Boolean)
}

function score(unit, queryTokens) {
  let s = 0
  const title = unit.title.toLowerCase()
  const detail = unit.detail.toLowerCase()
  const tags = (unit.tags || []).map(t => t.toLowerCase())

  for (const token of queryTokens) {
    if (tags.includes(token)) s += 5
    if (title.includes(token)) s += 4
    if (unit.type.toLowerCase() === token) s += 3
    if (detail.includes(token)) s += 1
  }
  return s
}

function filter(units, opts = {}) {
  let results = [...units]

  if (opts.type) {
    results = results.filter(u => u.type === opts.type)
  }
  if (opts.relevance) {
    results = results.filter(u => u.relevance === opts.relevance)
  }
  if (opts.tag) {
    results = results.filter(u => (u.tags || []).includes(opts.tag.toLowerCase()))
  }
  if (opts.video) {
    results = results.filter(u => u.video_id === opts.video)
  }

  if (opts.query) {
    const tokens = tokenize(opts.query)
    results = results
      .map(u => ({ unit: u, score: score(u, tokens) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.unit)
  }

  if (opts.top) {
    results = results.slice(0, opts.top)
  }

  return results
}

function formatMarkdown(results) {
  if (results.length === 0) return "No matching units found."
  return results.map(u => {
    const tags = (u.tags || []).join(", ")
    return `- **[${u.type}|${u.engine}|${u.relevance}]** ${u.title} — ${u.detail}\n  Tags: ${tags || "none"} · source: \`${u.video_id}\``
  }).join("\n")
}

function formatJSON(results) {
  return JSON.stringify(results, null, 2)
}

function formatSummary(results) {
  const byRelevance = {}
  for (const r of results) {
    byRelevance[r.relevance] = (byRelevance[r.relevance] || 0) + 1
  }
  return `Found ${results.length} units: ${Object.entries(byRelevance).map(([r, n]) => `${n} ${r}`).join(", ") || "none"}`
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function printUsage() {
  console.log(`gamedev-wisdom — query distilled game-dev knowledge (Code Monkey corpus)

Usage:
  node query.mjs <query>              Free-text search across title, detail, tags
  node query.mjs --type <type>        Filter: technique|concept|gotcha|code_pattern|best_practice|design
  node query.mjs --relevance <rel>    Filter: core|context (default: both; drop is never in this catalog)
  node query.mjs --tag <tag>          Filter by exact tag
  node query.mjs --video <video_id>   All units distilled from one source video
  node query.mjs --top <n>            Limit to top N results
  node query.mjs --json               Output as JSON (default is Markdown)

Examples:
  node query.mjs state machine enemy AI       Enemy AI state-machine patterns
  node query.mjs --type gotcha camera         Camera-related gotchas
  node query.mjs --relevance core pathfinding --top 5
  node query.mjs --tag decoupling --json`)
}

async function main() {
  const args = process.argv.slice(2)
  const opts = {}

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage()
    process.exit(0)
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === "--type" || a === "-t") opts.type = args[++i]
    else if (a === "--relevance" || a === "-r") opts.relevance = args[++i]
    else if (a === "--tag") opts.tag = args[++i]
    else if (a === "--video") opts.video = args[++i]
    else if (a === "--top" || a === "-n") opts.top = parseInt(args[++i], 10)
    else if (a === "--json") opts.json = true
    else if (!a.startsWith("--")) {
      opts.query = (opts.query ? opts.query + " " : "") + a
    }
  }

  const units = load()
  const results = filter(units, opts)

  console.log(formatSummary(results))
  console.log("")

  if (opts.json) {
    console.log(formatJSON(results))
  } else {
    console.log(formatMarkdown(results))
  }
}

main().catch(console.error)

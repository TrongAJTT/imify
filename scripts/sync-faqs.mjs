import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")

const HOMEPAGE_LOCALE_PATH = path.join(ROOT_DIR, "packages/i18n/src/locales/en/homepage.json")
const FAQS_OUTPUT_PATH = path.join(ROOT_DIR, "FAQs.md")

const LINK_VARIABLES = {
  recoveryUrl: "https://imify.trongajtt.com/recovery",
  updateUrl: "https://imify.trongajtt.com/update",
  chromeUrl: "https://support.google.com/chrome/answer/95647",
  edgeUrl:
    "https://support.microsoft.com/en-us/edge/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use",
  firefoxUrl: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox",
  githubIssuesUrl: "https://github.com/TrongAJTT/imify/issues/new/choose"
}

function interpolateVariables(text) {
  let result = text
  for (const [key, value] of Object.entries(LINK_VARIABLES)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
    result = result.replace(regex, value)
  }
  return result
}

async function syncFaqs() {
  const rawData = await readFile(HOMEPAGE_LOCALE_PATH, "utf8")
  const homepageJson = JSON.parse(rawData)
  const faqSection = homepageJson.faq ?? {}
  const title = faqSection.sectionTitle || "Frequently Asked Questions"
  const desc = faqSection.sectionDesc || "Everything you need to know about Imify."
  const items = Array.isArray(faqSection.items) ? faqSection.items : []

  const markdownChunks = [
    `# ${title}`,
    "",
    `> ${desc}`,
    "",
    "---",
    ""
  ]

  items.forEach((item, index) => {
    const question = item.question?.trim() || ""
    const answer = interpolateVariables(item.answer?.trim() || "")

    markdownChunks.push(`### ${index + 1}. ${question}`)
    markdownChunks.push("")
    markdownChunks.push(answer)
    markdownChunks.push("")
    markdownChunks.push("---")
    markdownChunks.push("")
  })

  // Remove trailing separator
  if (markdownChunks[markdownChunks.length - 2] === "---") {
    markdownChunks.pop()
    markdownChunks.pop()
  }

  const outputMarkdown = markdownChunks.join("\n").trim() + "\n"
  await writeFile(FAQS_OUTPUT_PATH, outputMarkdown, "utf8")

  console.log(`[sync-faqs] Generated FAQs.md with ${items.length} FAQ items.`)
}

syncFaqs().catch((err) => {
  console.error("[sync-faqs] Failed to generate FAQs.md:", err)
  process.exit(1)
})

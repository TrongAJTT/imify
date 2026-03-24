import { promises as fs } from "node:fs"
import path from "node:path"

import { zipSync } from "fflate"

const FIREFOX_BUILD_DIR = path.resolve("build", "firefox-mv3-prod")
const OUTPUT_ZIP = path.resolve("build", "firefox-mv3-prod.zip")

const collectFiles = async (rootDir, currentDir = rootDir) => {
  const entries = await fs.readdir(currentDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(rootDir, fullPath)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const relativePath = path
      .relative(rootDir, fullPath)
      .split(path.sep)
      .join("/")

    files.push({ fullPath, relativePath })
  }

  return files
}

const main = async () => {
  const buildExists = await fs
    .access(FIREFOX_BUILD_DIR)
    .then(() => true)
    .catch(() => false)

  if (!buildExists) {
    throw new Error(
      "Firefox build output not found. Run `pnpm build:firefox` first."
    )
  }

  const files = await collectFiles(FIREFOX_BUILD_DIR)

  if (files.length === 0) {
    throw new Error("Firefox build output is empty. Nothing to package.")
  }

  const zipInput = {}

  for (const file of files) {
    const bytes = await fs.readFile(file.fullPath)
    zipInput[file.relativePath] = new Uint8Array(bytes)
  }

  const zipped = zipSync(zipInput, { level: 9 })
  await fs.writeFile(OUTPUT_ZIP, Buffer.from(zipped))

  console.log(
    `[zip-firefox-build] packed ${files.length} files into ${OUTPUT_ZIP}`
  )
}

await main()

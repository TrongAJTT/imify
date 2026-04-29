import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootPackageJsonPath = path.resolve(__dirname, "../package.json")

async function run() {
  const [, , ...commandParts] = process.argv
  if (commandParts.length === 0) {
    console.error("[with-root-metadata] Missing command to run.")
    process.exitCode = 1
    return
  }

  const pkgRaw = await readFile(rootPackageJsonPath, "utf8")
  const pkg = JSON.parse(pkgRaw)
  const meta = pkg.imifyMetadata ?? {}

  const version = String(pkg.version ?? "2.0.0")
  const versionType = String(meta.versionType ?? "stable")
  const appName = String(meta.displayName ?? "Imify")

  const child = spawn(commandParts.join(" "), {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      IMIFY_PUBLIC_VERSION: version,
      IMIFY_PUBLIC_VERSION_TYPE: versionType,
      IMIFY_PUBLIC_APP_NAME: appName,
      NEXT_PUBLIC_VERSION: version,
      NEXT_PUBLIC_VERSION_TYPE: versionType,
      NEXT_PUBLIC_APP_NAME: appName,
      PLASMO_PUBLIC_VERSION: version,
      PLASMO_PUBLIC_VERSION_TYPE: versionType,
      PLASMO_PUBLIC_APP_NAME: appName
    }
  })

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exitCode = code ?? 0
  })
}

run().catch((error) => {
  console.error("[with-root-metadata] Failed:", error)
  process.exitCode = 1
})


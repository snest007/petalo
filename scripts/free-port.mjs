// Hold a cooperative claim until the caller's server exits. A socket probe
// alone releases the port before Vite's build has finished.
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, readdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs"
import { createServer } from "node:net"
import { tmpdir, userInfo } from "node:os"
import { join } from "node:path"

const claims = join(tmpdir(), `petalo-ports-${userInfo().uid}`)

function claimedBy(path) {
  try {
    const pid = Number(readlinkSync(path))
    if (!Number.isInteger(pid) || pid <= 0) throw new Error(`Invalid port claim: ${path}`)
    try { process.kill(pid, 0) } catch (error) {
      if (error.code === "ESRCH") return null
      throw error
    }
    return pid
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw error
  }
}

function claim(port) {
  const path = join(claims, String(port))
  try {
    symlinkSync(String(process.pid), path)
    return { release: () => unlinkSync(path) }
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    const pid = claimedBy(path)
    if (pid !== null) return { pid }
    // A killed process may leave a claim. An automatic selection can move
    // on safely; a caller can still use that port explicitly once it is free.
    return { abandoned: true }
  }
}

function probe(port, host) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(false)
      else if (host === "::1" && ["EADDRNOTAVAIL", "EAFNOSUPPORT"].includes(error.code)) resolve(true)
      else reject(error)
    })
    server.listen({ port, host, exclusive: true }, () => server.close((error) => error ? reject(error) : resolve(true)))
  })
}

// The Playwright Linux container may lack lsof. Resolve listening sockets
// through procfs there; unreadable descriptors belonging to other users are skipped.
function linuxListener(port) {
  const inodes = new Set()
  for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n").slice(1)) {
        const fields = line.trim().split(/\s+/)
        if (fields[3] === "0A" && Number.parseInt(fields[1].split(":").at(-1), 16) === port) inodes.add(fields[9])
      }
    } catch (error) { if (error.code !== "ENOENT") throw error }
  }
  if (!inodes.size) return undefined
  for (const pid of readdirSync("/proc").filter((entry) => /^\d+$/.test(entry))) {
    const path = `/proc/${pid}`
    let descriptors
    try { descriptors = readdirSync(`${path}/fd`) } catch { continue }
    for (const fd of descriptors) {
      try {
        const inode = /^socket:\[(\d+)\]$/.exec(readlinkSync(`${path}/fd/${fd}`))?.[1]
        if (inode && inodes.has(inode)) {
          const command = readFileSync(`${path}/cmdline`, "utf8").split("\0").filter(Boolean).join(" ")
          return `PID ${pid}: ${command}`
        }
      } catch { /* The process closed this descriptor. */ }
    }
  }
}
function listener(port, pid) {
  try {
    return execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    const owner = process.platform === "linux" ? linuxListener(port) : undefined
    if (owner) return owner
    if (pid) {
      try {
        const command = execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).trim()
        return `PID ${pid}: ${command}`
      } catch { return `PID ${pid} reserved the port` }
    }
    return "Listener exited or lsof could not identify its owner."
  }
}

export async function reservePort(variable, explicit, base) {
  const first = Number(explicit ?? base)
  if (!/^\d+$/.test(String(explicit ?? base)) || first < 1 || first > 65535) {
    throw new Error(`${variable} must be a TCP port from 1 to 65535 (received ${JSON.stringify(explicit)}).`)
  }
  mkdirSync(claims, { recursive: true, mode: 0o700 })
  const last = explicit === undefined ? Math.min(first + 999, 65535) : first
  for (let port = first; port <= last; port++) {
    const reservation = claim(port)
    if (!reservation.release && !reservation.pid && !reservation.abandoned) { port--; continue }
    const canProbe = reservation.release || (reservation.abandoned && explicit !== undefined)
    if (canProbe) {
      try {
        if (await probe(port, "127.0.0.1") && await probe(port, "::1")) {
          return { port, release: reservation.release ?? (() => {}) }
        }
      } catch (error) {
        reservation.release?.()
        throw error
      }
    }
    reservation.release?.()
    if (explicit !== undefined) throw new Error(`${variable}=${port} is busy.\n${listener(port, reservation.pid)}`)
  }
  throw new Error(`No free port for ${variable} in ${first}–${last}.`)
}

// The orchestration commands can build Storybook before delegating to
// test:summary. Check explicit ports before that work, then reserve again at launch.
export async function checkExplicitPorts(env, names) {
  try {
    for (const name of names) {
      if (env[name] === undefined) continue
      const reservation = await reservePort(name, env[name], 4310)
      reservation.release()
    }
    if (names.includes("PORT") && names.includes("SAPUI5_PORT") && env.PORT !== undefined && Number(env.PORT) === Number(env.SAPUI5_PORT)) {
      throw new Error("PORT and SAPUI5_PORT must identify different servers.")
    }
    return true
  } catch (error) {
    console.error(error.message)
    return false
  }
}

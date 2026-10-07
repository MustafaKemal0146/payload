import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadEnv } from './loadEnv.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const envKey = 'PAYLOAD_LOAD_ENV_SPEC'

describe('loadEnv', () => {
  let envDir: string

  beforeEach(() => {
    envDir = mkdtempSync(path.join(os.tmpdir(), 'payload-load-env-'))
    writeFileSync(path.join(envDir, '.env'), `${envKey}=loaded\n`)
  })

  afterEach(() => {
    rmSync(envDir, { force: true, recursive: true })
    delete process.env[envKey]
    // Set by `@next/env` after loading, it skips loading again in this and any child process
    delete process.env.__NEXT_PROCESSED_ENV
  })

  it('should load the env file from the given directory', () => {
    loadEnv(envDir)

    expect(process.env[envKey]).toBe('loaded')
  })

  it('should load the env file when transpiled to CommonJS by tsx', () => {
    const scriptPath = path.join(envDir, 'loadEnv.cts')
    writeFileSync(
      scriptPath,
      [
        `const { loadEnv } = require(${JSON.stringify(path.join(dirname, 'loadEnv.ts'))})`,
        `loadEnv(${JSON.stringify(envDir)})`,
        `process.stdout.write(process.env.${envKey} ?? '')`,
      ].join('\n'),
    )

    const output = execFileSync(process.execPath, [require.resolve('tsx/cli'), scriptPath], {
      encoding: 'utf8',
    })

    expect(output).toBe('loaded')
  })
})

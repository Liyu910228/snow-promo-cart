import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.env.TEMP || process.cwd(), 'node_modules', 'loader.js'))
const { Client } = require('ssh2')

const command = process.env.DEPLOY_CMD
if (!process.env.DEPLOY_HOST || !process.env.DEPLOY_USER || !process.env.DEPLOY_PASS || !command) {
  throw new Error('Missing DEPLOY_HOST, DEPLOY_USER, DEPLOY_PASS, or DEPLOY_CMD')
}

const conn = new Client()

conn.on('ready', () => {
  conn.exec(command, (err, stream) => {
    if (err) throw err
    stream.on('close', (code) => {
      conn.end()
      process.exit(code || 0)
    })
    stream.on('data', data => process.stdout.write(data.toString()))
    stream.stderr.on('data', data => process.stderr.write(data.toString()))
  })
})

conn.on('error', err => {
  console.error(err.message)
  process.exit(1)
})

conn.connect({
  host: process.env.DEPLOY_HOST,
  username: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASS,
  readyTimeout: 60000
})

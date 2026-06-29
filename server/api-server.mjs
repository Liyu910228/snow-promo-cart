import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataDir = process.env.DATA_DIR || path.join(rootDir, 'data')
const uploadDir = process.env.UPLOAD_DIR || path.join(rootDir, 'uploads')
const skillsDir = process.env.SKILLS_DIR || path.join(rootDir, 'skills')
const stateFile = path.join(dataDir, 'state.json')
const port = Number(process.env.PORT || 3001)
const publicBasePath = String(process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '')

const defaultState = {
  products: [],
  warehouses: [],
  accounts: [],
  orders: [],
  groupOrders: [],
  aiModels: []
}

const ensureStateFile = async () => {
  await fs.mkdir(dataDir, { recursive: true })
  try {
    await fs.access(stateFile)
  } catch {
    await fs.writeFile(stateFile, JSON.stringify(defaultState, null, 2), 'utf8')
  }
}

const readState = async () => {
  await ensureStateFile()
  try {
    const raw = await fs.readFile(stateFile, 'utf8')
    return { ...defaultState, ...JSON.parse(raw || '{}') }
  } catch {
    return { ...defaultState }
  }
}

const writeState = async (state) => {
  await ensureStateFile()
  const nextState = { ...defaultState, ...state }
  const tmpFile = `${stateFile}.tmp`
  await fs.writeFile(tmpFile, JSON.stringify(nextState, null, 2), 'utf8')
  await fs.rename(tmpFile, stateFile)
  return nextState
}

const safeFileName = (fileName) => String(fileName || 'image')
  .replace(/[^\w.-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'image'

const saveUploadedImage = async ({ fileName, mimeType, dataUrl }) => {
  if (!String(mimeType || '').startsWith('image/')) {
    throw new Error('Only image uploads are allowed')
  }

  const match = String(dataUrl || '').match(/^data:image\/[\w.+-]+;base64,(.+)$/)
  if (!match) {
    throw new Error('Invalid image data')
  }

  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB')
  }

  await fs.mkdir(uploadDir, { recursive: true })
  const extFromType = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const cleanName = safeFileName(fileName).replace(/\.[^.]+$/, '')
  const nextFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName}.${extFromType}`
  await fs.writeFile(path.join(uploadDir, nextFileName), buffer)
  return `${publicBasePath}/uploads/${nextFileName}`
}

const cacheRemoteImage = async ({ imageUrl }) => {
  const url = new URL(String(imageUrl || ''))
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http/https image URLs are supported')
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 SnowPromoCart/1.0',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  })
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new Error('Remote URL is not an image')
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5MB')
  }

  await fs.mkdir(uploadDir, { recursive: true })
  const extFromType = contentType.split(';')[0].split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const baseName = safeFileName(path.basename(url.pathname) || 'remote-image').replace(/\.[^.]+$/, '')
  const nextFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}.${extFromType}`
  await fs.writeFile(path.join(uploadDir, nextFileName), buffer)
  return `${publicBasePath}/uploads/${nextFileName}`
}

const readBody = (req) => new Promise((resolve, reject) => {
  let body = ''
  req.on('data', chunk => {
    body += chunk
    if (body.length > 20 * 1024 * 1024) {
      reject(new Error('Payload too large'))
      req.destroy()
    }
  })
  req.on('end', () => resolve(body ? JSON.parse(body) : {}))
  req.on('error', reject)
})

const safeSkillPath = (relativePath = '') => {
  const cleanPath = String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')

  if (path.isAbsolute(cleanPath) || cleanPath.split('/').includes('..')) {
    throw new Error('Invalid skill path')
  }

  const absolutePath = path.resolve(skillsDir, cleanPath)
  const relativeToRoot = path.relative(skillsDir, absolutePath)
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Invalid skill path')
  }

  return { cleanPath, absolutePath }
}

const listSkillTree = async (dir = skillsDir, prefix = '', depth = 0) => {
  await fs.mkdir(skillsDir, { recursive: true })
  if (depth > 8) return []

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const visibleEntries = entries
    .filter(entry => !entry.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  const nodes = []
  for (const entry of visibleEntries) {
    const nodePath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: nodePath,
        type: 'directory',
        children: await listSkillTree(path.join(dir, entry.name), nodePath, depth + 1)
      })
    } else if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        path: nodePath,
        type: 'file'
      })
    }
  }
  return nodes
}

const readSkillFile = async (relativePath) => {
  const { cleanPath, absolutePath } = safeSkillPath(relativePath)
  const stat = await fs.stat(absolutePath)
  if (!stat.isFile()) throw new Error('Skill path is not a file')
  if (stat.size > 1024 * 1024) throw new Error('Skill file is too large')
  return {
    path: cleanPath,
    content: await fs.readFile(absolutePath, 'utf8')
  }
}

const writeSkillFile = async ({ path: relativePath, content }) => {
  const { cleanPath, absolutePath } = safeSkillPath(relativePath)
  const allowed = ['.md', '.yaml', '.yml', '.json', '.txt']
  if (!allowed.includes(path.extname(cleanPath).toLowerCase())) {
    throw new Error('Only text skill files can be edited')
  }
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, String(content ?? ''), 'utf8')
  return { path: cleanPath, saved: true }
}

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(data))
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && req.url === '/api/state') {
      sendJson(res, 200, await readState())
      return
    }

    if (req.method === 'PUT' && req.url === '/api/state') {
      const body = await readBody(req)
      sendJson(res, 200, await writeState(body))
      return
    }

    if (req.method === 'POST' && req.url === '/api/upload-image') {
      const body = await readBody(req)
      sendJson(res, 200, { url: await saveUploadedImage(body) })
      return
    }

    if (req.method === 'POST' && req.url === '/api/cache-image') {
      const body = await readBody(req)
      sendJson(res, 200, { url: await cacheRemoteImage(body) })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/skills/tree') {
      sendJson(res, 200, {
        root: 'skills',
        path: skillsDir,
        tree: await listSkillTree()
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/skills/file') {
      sendJson(res, 200, await readSkillFile(url.searchParams.get('path') || ''))
      return
    }

    if (req.method === 'PUT' && url.pathname === '/api/skills/file') {
      const body = await readBody(req)
      sendJson(res, 200, await writeSkillFile(body))
      return
    }

    sendJson(res, 404, { message: 'Not found' })
  } catch (error) {
    sendJson(res, 500, { message: error instanceof Error ? error.message : 'Server error' })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Shared data API listening on 127.0.0.1:${port}`)
})

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(path.join(process.env.TEMP || process.cwd(), 'node_modules', 'loader.js'))
const { Client } = require('ssh2')

const config = {
  host: process.env.DEPLOY_HOST,
  username: process.env.DEPLOY_USER || 'root',
  password: process.env.DEPLOY_PASS,
  targetDir: process.env.DEPLOY_DIR || '/home/admin/dataCollection',
  localDist: path.resolve('dist'),
  localServer: path.resolve('server')
}

for (const [key, value] of Object.entries(config)) {
  if (!value) {
    throw new Error(`Missing deploy config: ${key}`)
  }
}

if (!fs.existsSync(path.join(config.localDist, 'index.html'))) {
  throw new Error(`Missing built app: ${config.localDist}`)
}

const conn = new Client()

const exec = (command) => new Promise((resolve, reject) => {
  conn.exec(command, (err, stream) => {
    if (err) return reject(err)
    let stdout = ''
    let stderr = ''
    stream.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(`Command failed (${code}): ${command}\n${stderr || stdout}`))
      }
    })
    stream.on('data', data => { stdout += data.toString() })
    stream.stderr.on('data', data => { stderr += data.toString() })
  })
})

const sftp = () => new Promise((resolve, reject) => {
  conn.sftp((err, client) => err ? reject(err) : resolve(client))
})

const mkdir = (client, remotePath) => new Promise((resolve, reject) => {
  client.mkdir(remotePath, { mode: 0o755 }, (err) => {
    if (err && err.code !== 4) return reject(err)
    resolve()
  })
})

const uploadFile = (client, localPath, remotePath) => new Promise((resolve, reject) => {
  client.fastPut(localPath, remotePath, {}, (err) => err ? reject(err) : resolve())
})

const uploadDir = async (client, localDir, remoteDir) => {
  await mkdir(client, remoteDir)
  const entries = fs.readdirSync(localDir, { withFileTypes: true })
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name)
    const remotePath = `${remoteDir}/${entry.name}`
    if (entry.isDirectory()) {
      await uploadDir(client, localPath, remotePath)
    } else {
      await uploadFile(client, localPath, remotePath)
    }
  }
}

const nginxConf = (rootDir, serverName) => `server {
  listen 80;
  server_name ${serverName};

  root ${rootDir}/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location ^~ /uploads/ {
    alias ${rootDir}/uploads/;
    expires 30d;
    add_header Cache-Control "public";
  }

  location ~* \\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public";
  }
}
`

const main = async () => {
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve)
    conn.on('error', reject)
    conn.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      readyTimeout: 60000
    })
  })

  console.log('SSH connected')

  const osInfo = await exec('cat /etc/os-release 2>/dev/null | head -n 3 || uname -a')
  console.log(osInfo)

  await exec(`mkdir -p '${config.targetDir}' && rm -rf '${config.targetDir}/dist.new' && mkdir -p '${config.targetDir}/dist.new'`)
  const client = await sftp()
  await uploadDir(client, config.localDist, `${config.targetDir}/dist.new`)
  await uploadDir(client, config.localServer, `${config.targetDir}/server`)
  client.end()

  await exec(`set -e
rm -rf '${config.targetDir}/dist'
mv '${config.targetDir}/dist.new' '${config.targetDir}/dist'
`)
  console.log('dist uploaded')

  const serviceConf = `[Unit]
Description=Snow Promo Cart shared data API
After=network.target

[Service]
Type=simple
WorkingDirectory=${config.targetDir}
Environment=PORT=3001
Environment=DATA_DIR=${config.targetDir}/data
Environment=UPLOAD_DIR=${config.targetDir}/uploads
ExecStart=/usr/bin/node ${config.targetDir}/server/api-server.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
`
  const serviceEncoded = Buffer.from(serviceConf).toString('base64')
  await exec(`set -e
if ! command -v node >/dev/null 2>&1; then
  if command -v yum >/dev/null 2>&1; then
    yum install -y nodejs npm
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y nodejs npm
  else
    echo "No supported package manager found for nodejs" >&2
    exit 1
  fi
fi
mkdir -p '${config.targetDir}/data'
mkdir -p '${config.targetDir}/uploads'
echo '${serviceEncoded}' | base64 -d > /etc/systemd/system/snow-promo-cart-api.service
systemctl daemon-reload
systemctl enable snow-promo-cart-api >/dev/null 2>&1
systemctl restart snow-promo-cart-api
`)
  console.log('shared data API started')

  const hasNginx = await exec('command -v nginx >/dev/null 2>&1 && echo yes || echo no')
  if (hasNginx.trim() !== 'yes') {
    await exec(`set -e
if command -v apt-get >/dev/null 2>&1; then
  apt-get update && apt-get install -y nginx
elif command -v yum >/dev/null 2>&1; then
  yum install -y nginx
else
  echo "No supported package manager found" >&2
  exit 1
fi
`)
    console.log('nginx installed')
  }

  const confPath = '/etc/nginx/conf.d/snow-promo-cart.conf'
  const escaped = Buffer.from(nginxConf(config.targetDir, config.host)).toString('base64')
  await exec(`echo '${escaped}' | base64 -d > '${confPath}'`)
  await exec('nginx -t')
  await exec('systemctl enable nginx >/dev/null 2>&1 || true')
  await exec('systemctl reload nginx || systemctl restart nginx')
  console.log('nginx configured and reloaded')

  conn.end()
}

main().catch(err => {
  console.error(err.message)
  conn.end()
  process.exit(1)
})

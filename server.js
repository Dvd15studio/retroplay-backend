const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Range', 'User-Agent']
}));

app.use(express.json());

const CLOUDFLARE_R2_BASE = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

// Global Game Catalog Map
let GAME_CATALOG = {};

function tryLoadFromLocalTxt() {
  const possiblePaths = [
    path.join(__dirname, 'Links Rr2.txt'),
    path.join(__dirname, 'meus_links_r2.txt'),
    path.join(__dirname, 'links_r2.txt'),
    path.join(__dirname, 'Links_Rr2.txt'),
    path.join(__dirname, 'meus_links.txt')
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.log('ℹ️ Nenhum arquivo TXT de manifesto encontrado. Carregando catálogo padrão de emergência.');
    loadFallbackCatalog();
    return;
  }

  try {
    console.log(`📄 Lendo e indexando acervo do Cloudflare R2 a partir de: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // System-Isolated Cover Maps to prevent cross-platform cover pollution
    const systemCoverMaps = {
      NES: { exact: new Map(), clean: new Map(), norm: new Map() },
      SNES: { exact: new Map(), clean: new Map(), norm: new Map() },
      MEGADRIVE: { exact: new Map(), clean: new Map(), norm: new Map() },
      PS1: { exact: new Map(), clean: new Map(), norm: new Map() },
      PS2: { exact: new Map(), clean: new Map(), norm: new Map() }
    };

    const rawEntries = [];
    let currentKey = null;

    for (let line of lines) {
      line = line.trim();
      if (line.match(/^\d+\.\s+/)) {
        currentKey = line.replace(/^\d+\.\s+/, '').split(' (')[0].trim();
      } else if (line.startsWith('Link:')) {
        const link = line.replace('Link:', '').trim();
        if (currentKey && link) {
          rawEntries.push({ key: currentKey, link: link });
        }
        currentKey = null;
      }
    }

    function getSystemFromKey(keyUpper) {
      if (keyUpper.startsWith('NES/') || keyUpper.includes('/NES/')) return 'NES';
      if (keyUpper.startsWith('SNES/') || keyUpper.includes('/SNES/')) return 'SNES';
      if (keyUpper.startsWith('MEGA/') || keyUpper.includes('/MEGA/')) return 'MEGADRIVE';
      if (keyUpper.startsWith('PS1/') || keyUpper.includes('/PS1/')) return 'PS1';
      if (keyUpper.startsWith('PS2/') || keyUpper.includes('/PS2/')) return 'PS2';
      return 'NES';
    }

    function cleanGameTitle(rawTitle) {
      return rawTitle
        .replace(/\s*\((USA|Europe|Japan|World|En|Fr|De|Es|It|Pt|Sv|Nl|Rev\s*[\w\d]+|Unl|Proto|Promo|Virtual Console|Gluk Video|GameCube Edition|Pirate)[^)]*\)/gi, '')
        .replace(/\s*\[[^\]]*\]/gi, '')
        .replace(/\s*~\s*.*/gi, '')
        .trim();
    }

    // PASS 1: Populate system-isolated cover maps
    for (const entry of rawEntries) {
      const lowerKey = entry.key.toLowerCase();
      const upperKey = entry.key.toUpperCase();
      const isCover = lowerKey.includes('/capa') || lowerKey.includes('/capas') || lowerKey.includes('/cover') || lowerKey.includes('/covers');

      if (isCover) {
        const sys = getSystemFromKey(upperKey);
        const parts = entry.key.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const baseName = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;

        const exactKey = baseName.toLowerCase();
        const cleanKey = cleanGameTitle(baseName).toLowerCase();
        const normKey = baseName.replace(/[^a-z0-9]/g, '').toLowerCase();

        const maps = systemCoverMaps[sys];
        if (maps) {
          maps.exact.set(exactKey, entry.link);
          if (cleanKey && !maps.clean.has(cleanKey)) {
            maps.clean.set(cleanKey, entry.link);
          }
          if (normKey && !maps.norm.has(normKey)) {
            maps.norm.set(normKey, entry.link);
          }
        }
      }
    }

    // PASS 2: Populate ROMs and attach strictly matched cover
    let parsedCatalog = {};
    let romIndex = 1;

    for (const entry of rawEntries) {
      const lowerKey = entry.key.toLowerCase();
      const upperKey = entry.key.toUpperCase();
      const isCover = lowerKey.includes('/capa') || lowerKey.includes('/capas') || lowerKey.includes('/cover') || lowerKey.includes('/covers');

      if (!isCover && (lowerKey.includes('/rom') || lowerKey.includes('/roms') || lowerKey.match(/\.(nes|sfc|smc|md|smd|gen|chd|cue|iso|fds)$/i))) {
        const parts = entry.key.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const extension = filenameWithExt.split('.').pop().toLowerCase();
        const baseName = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;

        if (['sav', 'srm', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'nfo', 'xml'].includes(extension)) {
          continue;
        }

        let system = getSystemFromKey(upperKey);
        let ejsCore = 'nes';

        if (system === 'SNES' || extension === 'sfc' || extension === 'smc') {
          system = 'SNES';
          ejsCore = 'snes';
        } else if (system === 'MEGADRIVE' || extension === 'md' || extension === 'smd' || extension === 'gen') {
          system = 'MEGADRIVE';
          ejsCore = 'segaMD';
        } else if (system === 'PS1' || extension === 'chd' || extension === 'cue') {
          if (upperKey.includes('/PS1/')) {
            system = 'PS1';
            ejsCore = 'psx';
          }
        } else if (system === 'PS2' || upperKey.includes('/PS2/')) {
          system = 'PS2';
          ejsCore = 'play';
        } else if (system === 'NES' || extension === 'nes' || extension === 'fds') {
          system = 'NES';
          ejsCore = 'nes';
        }

        let cleanTitle = cleanGameTitle(baseName);
        if (!cleanTitle) cleanTitle = baseName;

        const exactKey = baseName.toLowerCase();
        const cleanKey = cleanTitle.toLowerCase();
        const normKey = baseName.replace(/[^a-z0-9]/g, '').toLowerCase();

        const sysMaps = systemCoverMaps[system] || systemCoverMaps['NES'];
        let coverUrl = sysMaps.exact.get(exactKey) || sysMaps.clean.get(cleanKey) || sysMaps.norm.get(normKey) || '';

        const id = `game-${romIndex}-${system.toLowerCase()}-${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        parsedCatalog[id] = {
          id,
          title: cleanTitle,
          fullTitle: baseName,
          system,
          ejsCore,
          romUrl: entry.link,
          coverUrl,
        };

        romIndex++;
      }
    }

    if (Object.keys(parsedCatalog).length > 0) {
      GAME_CATALOG = parsedCatalog;
      console.log(`===================================================`);
      console.log(`✅ Catálogo R2 indexado com sucesso: ${Object.keys(GAME_CATALOG).length} jogos carregados!`);
      console.log(`===================================================`);
    } else {
      loadFallbackCatalog();
    }
  } catch (err) {
    console.error('❌ Erro ao ler manifesto TXT do R2:', err.message);
    loadFallbackCatalog();
  }
}

function loadFallbackCatalog() {
  GAME_CATALOG = {
    'nes-mario-25th': {
      id: 'nes-mario-25th',
      title: '25th Anniversary Super Mario Bros.',
      fullTitle: '25th Anniversary Super Mario Bros. (Europe)',
      system: 'NES',
      ejsCore: 'nes',
      romUrl: `${CLOUDFLARE_R2_BASE}/NES/ROMS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe).nes`,
      coverUrl: `${CLOUDFLARE_R2_BASE}/NES/CAPAS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe).png`,
    },
    'md-aladdin': {
      id: 'md-aladdin',
      title: 'Disney\'s Aladdin',
      fullTitle: 'Aladdin (USA)',
      system: 'MEGADRIVE',
      ejsCore: 'segaMD',
      romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Aladdin%20(USA).md`,
      coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Aladdin.png`,
    }
  };
}

tryLoadFromLocalTxt();

function sanitizeR2Url(rawUrl) {
  if (!rawUrl) return '';
  try {
    const decoded = decodeURIComponent(rawUrl);
    return encodeURI(decoded);
  } catch (err) {
    return rawUrl;
  }
}

function proxyRomStream(targetUrl, req, res, maxRedirects = 5) {
  if (maxRedirects === 0) {
    return res.status(500).json({ error: 'Muitos redirecionamentos no R2.' });
  }

  const cleanUrl = sanitizeR2Url(targetUrl);

  let parsedUrl;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch (e) {
    return res.status(400).json({ error: 'URL inválida.' });
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  };

  if (req.headers['range']) {
    headers['Range'] = req.headers['range'];
  }

  const requestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: headers,
  };

  const remoteReq = client.request(requestOptions, (remoteRes) => {
    if ([301, 302, 303, 307, 308].includes(remoteRes.statusCode) && remoteRes.headers.location) {
      const redirectUrl = new URL(remoteRes.headers.location, cleanUrl).href;
      return proxyRomStream(redirectUrl, req, res, maxRedirects - 1);
    }

    if (remoteRes.statusCode < 200 || remoteRes.statusCode >= 400) {
      return res.status(remoteRes.statusCode).json({ error: `Cloudflare R2 HTTP ${remoteRes.statusCode}` });
    }

    res.status(remoteRes.statusCode);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (remoteRes.headers['content-type']) res.setHeader('Content-Type', remoteRes.headers['content-type']);
    if (remoteRes.headers['content-length']) res.setHeader('Content-Length', remoteRes.headers['content-length']);
    if (remoteRes.headers['content-range']) res.setHeader('Content-Range', remoteRes.headers['content-range']);
    if (remoteRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', remoteRes.headers['accept-ranges']);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.method === 'HEAD') {
      return res.end();
    }

    remoteRes.pipe(res);
  });

  remoteReq.setTimeout(30000, () => {
    remoteReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Timeout ao conectar com o R2.' });
    }
  });

  remoteReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Erro no proxy do R2.' });
    }
  });

  remoteReq.end();
}

app.get('/', (req, res) => {
  return res.send(`🚀 RETROPLAY BACKEND ONLINE - CATÁLOGO COM ${Object.keys(GAME_CATALOG).length} JOGOS!`);
});

app.all(['/api/proxy-rom', '/api/proxy-rom/:filename'], (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL não informada.' });
  }

  proxyRomStream(targetUrl, req, res);
});

app.get('/api/games', (req, res) => {
  const gamesList = Object.values(GAME_CATALOG).map((game) => ({
    id: game.id,
    title: game.title,
    fullTitle: game.fullTitle,
    system: game.system,
    ejsCore: game.ejsCore,
    demoRomUrl: game.romUrl,
    coverUrl: game.coverUrl,
  }));
  return res.json({ catalog: gamesList });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 RETROPLAY BACKEND SERVING ON PORT: ${PORT}`);
  console.log(`🎮 TOTAL DE JOGOS NO CATÁLOGO: ${Object.keys(GAME_CATALOG).length}`);
  console.log(`===================================================`);
});
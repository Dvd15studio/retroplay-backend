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

// Global Game Catalog
let GAME_CATALOG = {};

function tryLoadFromLocalTxt() {
  const possiblePaths = [
    path.join(__dirname, 'meus_links_r2.txt'),
    path.join(__dirname, 'Links Rr2.txt'),
    path.join(__dirname, 'links_r2.txt'),
    path.join(__dirname, 'Links_Rr2.txt'),
    path.join(__dirname, 'Links Rr2.txt.txt')
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.log('ℹ️ Nenhum arquivo TXT de manifesto encontrado no diretório. Usando catálogo pré-indexado padrão.');
    loadFallbackCatalog();
    return;
  }

  try {
    console.log(`📄 Carregando acervo a partir do arquivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const coversMapExact = new Map();
    const coversMapClean = new Map();

    let currentKey = null;
    let currentLink = null;

    // PASS 1: Index all exact Cover links from the file
    for (let line of lines) {
      line = line.trim();
      if (line.match(/^\d+\.\s+/)) {
        currentKey = line.replace(/^\d+\.\s+/, '').split(' (')[0].trim();
      } else if (line.startsWith('Link:')) {
        currentLink = line.replace('Link:', '').trim();

        if (currentKey && currentLink && (currentKey.includes('/CAPA/') || currentKey.includes('/CAPAS/'))) {
          const parts = currentKey.split('/');
          const filenameWithExt = parts[parts.length - 1];
          const baseName = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'));
          
          const exactKey = baseName.toLowerCase();
          const cleanKey = baseName.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim().toLowerCase();

          coversMapExact.set(exactKey, currentLink);
          if (!coversMapClean.has(cleanKey)) {
            coversMapClean.set(cleanKey, currentLink);
          }
        }
        currentKey = null;
        currentLink = null;
      }
    }

    // PASS 2: Index all ROMs and map to their covers
    let parsedCatalog = {};
    let romIndex = 1;

    for (let line of lines) {
      line = line.trim();
      if (line.match(/^\d+\.\s+/)) {
        currentKey = line.replace(/^\d+\.\s+/, '').split(' (')[0].trim();
      } else if (line.startsWith('Link:')) {
        currentLink = line.replace('Link:', '').trim();

        if (currentKey && currentLink && currentKey.includes('/ROMS/')) {
          const parts = currentKey.split('/');
          const consoleFolder = parts[0]; // e.g. MEGA or SNES
          const filenameWithExt = parts[parts.length - 1];
          const extension = filenameWithExt.split('.').pop().toLowerCase();
          const baseName = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'));

          // Ignore save files or image files accidentally placed in ROMs
          if (extension === 'sav' || extension === 'png' || extension === 'jpg') {
            currentKey = null;
            currentLink = null;
            continue;
          }

          let system = 'NES';
          let ejsCore = 'nes';

          if (consoleFolder === 'MEGA' || extension === 'md' || extension === 'smd') {
            system = 'MEGADRIVE';
            ejsCore = 'segaMD';
          }

          // Clean display title for UI
          let cleanTitle = baseName
            .replace(/\s*\(USA[^)]*\)/gi, '')
            .replace(/\s*\(Europe[^)]*\)/gi, '')
            .replace(/\s*\(Japan[^)]*\)/gi, '')
            .replace(/\s*\(World[^)]*\)/gi, '')
            .replace(/\s*\[[^\]]*\]/gi, '')
            .trim();

          if (!cleanTitle) cleanTitle = baseName;

          // Generate unique ID per ROM entry to prevent overwriting
          const id = `game-${romIndex}-${system.toLowerCase()}-${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          // Match exact cover URL from Pass 1
          const exactKey = baseName.toLowerCase();
          const cleanKey = baseName.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim().toLowerCase();

          let coverUrl = coversMapExact.get(exactKey) || coversMapClean.get(cleanKey) || coversMapClean.get(cleanTitle.toLowerCase());

          if (!coverUrl) {
            let coverFolder = consoleFolder === 'MEGA' ? 'MEGA/CAPA' : 'SNES/CAPAS';
            coverUrl = `${CLOUDFLARE_R2_BASE}/${coverFolder}/${encodeURIComponent(baseName)}.png`;
          }

          parsedCatalog[id] = {
            id,
            title: cleanTitle,
            fullTitle: baseName,
            system,
            ejsCore,
            romUrl: currentLink,
            coverUrl,
          };

          romIndex++;
        }

        currentKey = null;
        currentLink = null;
      }
    }

    if (Object.keys(parsedCatalog).length > 0) {
      GAME_CATALOG = parsedCatalog;
      console.log(`===================================================`);
      console.log(`✅ Sucesso! Catálogo dinâmico carregado com ${Object.keys(GAME_CATALOG).length} jogos!`);
      console.log(`===================================================`);
    } else {
      loadFallbackCatalog();
    }
  } catch (err) {
    console.error('❌ Erro ao ler arquivo TXT:', err.message);
    loadFallbackCatalog();
  }
}

function loadFallbackCatalog() {
  GAME_CATALOG = {
    'nes-mario-25th': {
      id: 'nes-mario-25th',
      title: '25th Anniversary Super Mario Bros.',
      fullTitle: '25th Anniversary Super Mario Bros. (Europe) (Promo, Virtual Console)',
      system: 'NES',
      ejsCore: 'nes',
      romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).nes`,
      coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).png`,
    },
    'md-aladdin': {
      id: 'md-aladdin',
      title: 'Disney\'s Aladdin (Mega Drive)',
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
    const parsed = new URL(rawUrl);
    const cleanPath = parsed.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return '';
        try {
          const decoded = decodeURIComponent(segment);
          return encodeURIComponent(decoded);
        } catch (e) {
          return segment;
        }
      })
      .join('/');

    return `${parsed.protocol}//${parsed.host}${cleanPath}${parsed.search}`;
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
    return res.status(400).json({ error: 'URL da mídia inválida.' });
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
      return res.status(remoteRes.statusCode).json({ error: `Cloudflare R2 retornou HTTP ${remoteRes.statusCode}` });
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
  return res.send(`🚀 RETROPLAY BACKEND ONLINE - CATÁLOGO COM ${Object.keys(GAME_CATALOG).length} JOGOS CARREGADOS!`);
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
  console.log(`🚀 RETROPLAY BACKEND RUNNING ON PORT: ${PORT}`);
  console.log(`🎮 TOTAL DE JOGOS NO CATÁLOGO: ${Object.keys(GAME_CATALOG).length}`);
  console.log(`===================================================`);
});
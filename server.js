const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const app = express();

// Enable CORS for all cross-origin requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Range', 'User-Agent']
}));

app.use(express.json());

const CLOUDFLARE_R2_BASE = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

// Default fallback catalog if no txt file is loaded dynamically
let GAME_CATALOG = {
  // NES
  'nes-mario-25th': {
    id: 'nes-mario-25th',
    title: '25th Anniversary Super Mario Bros.',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).png`,
  },
  'nes-mario-1': {
    id: 'nes-mario-1',
    title: 'Super Mario Bros.',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Super%20Mario%20Bros.%20(World).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Super%20Mario%20Bros.%20(World).png`,
  },
  'nes-mario-2': {
    id: 'nes-mario-2',
    title: 'Super Mario Bros. 2',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Super%20Mario%20Bros.%202%20(USA)%20(Rev%201).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).png`,
  },
  'nes-mario-3': {
    id: 'nes-mario-3',
    title: 'Super Mario Bros. 3',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Super%20Mario%20Bros.%203%20(USA)%20(Rev%20A).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Super%20Mario%20Bros.%20(World).png`,
  },
  'nes-aladdin': {
    id: 'nes-aladdin',
    title: 'Disney\'s Aladdin (NES)',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Aladdin%20(Europe).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Aladdin%20(Europe).png`,
  },
  'nes-zelda-1': {
    id: 'nes-zelda-1',
    title: 'The Legend of Zelda',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Legend%20of%20Zelda%2C%20The%20(USA)%20(Rev%201).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Legend%20of%20Zelda%2C%20The%20(USA)%20(Rev%201).png`,
  },
  'nes-castlevania-1': {
    id: 'nes-castlevania-1',
    title: 'Castlevania',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Castlevania%20(USA)%20(Rev%201).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Castlevania%20(USA)%20(Rev%201).png`,
  },
  'nes-mega-man-2': {
    id: 'nes-mega-man-2',
    title: 'Mega Man 2',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Mega%20Man%202%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Mega%20Man%202%20(USA).png`,
  },

  // MEGA DRIVE
  'md-aladdin': {
    id: 'md-aladdin',
    title: 'Disney\'s Aladdin (Mega Drive)',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Aladdin%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Aladdin.png`,
  },
  'md-lion-king': {
    id: 'md-lion-king',
    title: 'Disney\'s The Lion King',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Disney's%20The%20Lion%20King.smd`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Disney's%20The%20Lion%20King.png`,
  },
  'md-sonic-1': {
    id: 'md-sonic-1',
    title: 'Sonic The Hedgehog',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Sonic%20The%20Hedgehog%20(USA%2C%20Europe).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Sonic%20The%20Hedgehog%20(USA%2C%20Europe).png`,
  },
  'md-sonic-2': {
    id: 'md-sonic-2',
    title: 'Sonic The Hedgehog 2',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Sonic%20The%20Hedgehog%202%20(World)%20(Rev%20B).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Sonic%20The%20Hedgehog%202%20(World)%20(Rev%20B).png`,
  },
  'md-streets-rage-2': {
    id: 'md-streets-rage-2',
    title: 'Streets of Rage 2',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Streets%20of%20Rage%202%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Streets%20Of%20Rage%20II.png`,
  },
  'md-mortal-kombat-3': {
    id: 'md-mortal-kombat-3',
    title: 'Mortal Kombat 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Mortal%20Kombat%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Mortal%20Kombat%203%20(USA).png`,
  },
  'md-earthworm-jim': {
    id: 'md-earthworm-jim',
    title: 'Earthworm Jim',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Earthworm%20Jim%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Earthworm%20Jim%20I.png`,
  }
};

function tryLoadFromLocalTxt() {
  const possiblePaths = [
    path.join(__dirname, 'meus_links_r2.txt'),
    path.join(__dirname, 'Links Rr2.txt'),
    path.join(__dirname, 'links_r2.txt')
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.log('ℹ️ Nenhum arquivo TXT de manifesto encontrado no diretório. Usando catálogo padrão.');
    return;
  }

  try {
    console.log(`📄 Carregando acervo a partir do arquivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let parsedCatalog = {};
    let currentKey = null;
    let currentLink = null;

    for (let line of lines) {
      line = line.trim();
      if (line.match(/^\d+\.\s+/)) {
        currentKey = line.replace(/^\d+\.\s+/, '').split(' (')[0].trim();
      } else if (line.startsWith('Link:')) {
        currentLink = line.replace('Link:', '').trim();

        if (currentKey && currentLink && currentKey.includes('/ROMS/')) {
          const parts = currentKey.split('/');
          const consoleFolder = parts[0]; // e.g. MEGA or SNES
          const filenameWithExt = parts[parts.length - 1]; // e.g. Aladdin (USA).md
          const extension = filenameWithExt.split('.').pop().toLowerCase();
          const baseName = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'));

          let system = 'NES';
          let ejsCore = 'nes';

          if (consoleFolder === 'MEGA' || extension === 'md' || extension === 'smd') {
            system = 'MEGADRIVE';
            ejsCore = 'segaMD';
          }

          const id = `${system.toLowerCase()}-${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          // Construct cover URL by convention if available
          let coverFolder = consoleFolder === 'MEGA' ? 'MEGA/CAPA' : 'SNES/CAPAS';
          let coverExt = 'png';
          let coverUrl = `${CLOUDFLARE_R2_BASE}/${coverFolder}/${encodeURIComponent(baseName)}.${coverExt}`;

          parsedCatalog[id] = {
            id,
            title: baseName,
            system,
            ejsCore,
            romUrl: currentLink,
            coverUrl,
          };
        }

        currentKey = null;
        currentLink = null;
      }
    }

    if (Object.keys(parsedCatalog).length > 0) {
      GAME_CATALOG = parsedCatalog;
      console.log(`✅ Sucesso! Catálogo carregado dinamicamente com ${Object.keys(GAME_CATALOG).length} jogos.`);
    }
  } catch (err) {
    console.error('❌ Erro ao ler arquivo TXT:', err.message);
  }
}

tryLoadFromLocalTxt();

function sanitizeR2Url(rawUrl) {
  if (!rawUrl) return '';
  try {
    let decoded = rawUrl;
    while (decoded.includes('%')) {
      const prev = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {
        break;
      }
      if (decoded === prev) break;
    }
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
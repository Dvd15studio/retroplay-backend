const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Range', 'User-Agent']
}));

app.use(express.json());

app.get('/', (req, res) => {
  return res.send('🚀 RETROPLAY BACKEND ONLINE - PROXY DE ROMS E CAPAS DO CLOUDFLARE R2 PRONTO!');
});

const CLOUDFLARE_R2_BASE = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

const GAME_CATALOG = {
  'nes-mario-25th': {
    id: 'nes-mario-25th',
    title: '25th Anniversary Super Mario Bros.',
    system: 'NES',
    sizeMb: 0.1,
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/25th%20Anniversary%20Super%20Mario%20Bros.%20(Europe)%20(Promo%2C%20Virtual%20Console).png`,
    isHeavy: false,
  },
  'nes-mario-3': {
    id: 'nes-mario-3',
    title: 'Super Mario Bros. 3',
    system: 'NES',
    sizeMb: 0.38,
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Super%20Mario%20Bros.%203%20(USA)%20(Rev%20A).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Super%20Mario%20Bros.%20(World).png`,
    isHeavy: false,
  },
  'nes-aladdin': {
    id: 'nes-aladdin',
    title: 'Disney\'s Aladdin (NES)',
    system: 'NES',
    sizeMb: 0.25,
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Aladdin%20(Europe).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Aladdin%20(Europe).png`,
    isHeavy: false,
  },
  'nes-zelda': {
    id: 'nes-zelda',
    title: 'The Legend of Zelda',
    system: 'NES',
    sizeMb: 0.13,
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Legend%20of%20Zelda%2C%20The%20(USA)%20(Rev%201).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Legend%20of%20Zelda%2C%20The%20(USA)%20(Rev%201).png`,
    isHeavy: false,
  },
  'md-aladdin': {
    id: 'md-aladdin',
    title: 'Disney\'s Aladdin (Mega Drive)',
    system: 'MEGADRIVE',
    sizeMb: 2.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Aladdin%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Aladdin.png`,
    isHeavy: false,
  },
  'md-sonic-2': {
    id: 'md-sonic-2',
    title: 'Sonic the Hedgehog 2',
    system: 'MEGADRIVE',
    sizeMb: 1.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Sonic%20The%20Hedgehog%202%20(World)%20(Rev%20B).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Sonic%20The%20Hedgehog%20II.png`,
    isHeavy: false,
  },
  'md-streets-rage-2': {
    id: 'md-streets-rage-2',
    title: 'Streets of Rage 2',
    system: 'MEGADRIVE',
    sizeMb: 2.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Streets%20of%20Rage%202%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Streets%20Of%20Rage%20II.png`,
    isHeavy: false,
  },
  'md-mortal-kombat-3': {
    id: 'md-mortal-kombat-3',
    title: 'Mortal Kombat 3',
    system: 'MEGADRIVE',
    sizeMb: 4.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Mortal%20Kombat%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Mortal%20Kombat%20III.png`,
    isHeavy: false,
  }
};

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
    console.error('[PROXY ERROR] Excedido limite de redirecionamentos');
    return res.status(500).json({ error: 'Muitos redirecionamentos no servidor R2.' });
  }

  const cleanUrl = sanitizeR2Url(targetUrl);
  console.log(`[PROXY FETCHING FROM R2]: ${cleanUrl}`);

  let parsedUrl;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch (e) {
    console.error(`[PROXY ERROR] URL inválida: ${cleanUrl}`, e);
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
      console.error(`[PROXY ERROR] HTTP ${remoteRes.statusCode} no R2 ao buscar: ${parsedUrl.href}`);
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
      res.status(504).json({ error: 'Timeout ao conectar com o Cloudflare R2.' });
    }
  });

  remoteReq.on('error', (err) => {
    console.error('[PROXY EXCEPTION]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Erro no proxy do R2.' });
    }
  });

  remoteReq.end();
}

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
    sizeMb: game.sizeMb,
    isHeavy: game.isHeavy,
    ejsCore: game.ejsCore,
    demoRomUrl: game.romUrl,
    coverUrl: game.coverUrl,
  }));
  return res.json({ catalog: gamesList });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 RETROPLAY BACKEND ONLINE NA PORTA: ${PORT}`);
  console.log(`☁️ PROXY DE ROMS E CAPAS DO CLOUDFLARE R2 PRONTO!`);
  console.log(`===================================================`);
});
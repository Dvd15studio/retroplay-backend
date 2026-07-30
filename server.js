const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

// Habilita CORS completo para requisições do Flutter Web e Vercel
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Range', 'User-Agent']
}));

app.use(express.json());

app.get('/', (req, res) => {
  return res.send('🚀 RETROPLAY BACKEND ONLINE - PROXY DE ROMS E CAPAS CONECTADO!');
});

// URL Base pública do seu Cloudflare R2
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
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 0.5,
    ejsCore: 'snes',
    romUrl: `${CLOUDFLARE_R2_BASE}/Super%20Mario%20World%20(U)%20%5B!%5D.smc`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/super-mario-world.jpg`,
    isHeavy: false,
  },
  'snes-aladdin': {
    id: 'snes-aladdin',
    title: 'Disney\'s Aladdin (SNES)',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Aladdin%20(USA).sfc`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Aladdin%20(USA).png`,
    isHeavy: false,
  },
  'md-aladdin': {
    id: 'md-aladdin',
    title: 'Disney\'s Aladdin (Mega Drive)',
    system: 'MEGADRIVE',
    sizeMb: 2.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGADRIVE/ROMS/Aladdin%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGADRIVE/CAPAS/Aladdin%20(USA).png`,
    isHeavy: false,
  }
};

/**
 * Sanitiza e limpa a URL garantindo compatibilidade com o Cloudflare R2
 */
function sanitizeR2Url(rawUrl) {
  if (!rawUrl) return '';
  try {
    let decoded = rawUrl;
    // Decodifica repetidamente %2520, %2C, etc.
    while (decoded.includes('%')) {
      const prev = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {
        break;
      }
      if (decoded === prev) break;
    }
    // Aplica encodeURI na string limpa
    return encodeURI(decoded);
  } catch (err) {
    return rawUrl;
  }
}

/**
 * Realiza o streaming da ROM ou Capa direto do Cloudflare R2 com bypass de CORS
 */
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

app.all('/api/proxy-rom', (req, res) => {
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
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
  return res.send('🚀 RETROPLAY BACKEND ONLINE - CLOUDFLARE R2 PRÓPRIO CONECTADO!');
});

const CLOUDFLARE_R2_BASE = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

const GAME_CATALOG = {
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 0.5,
    ejsCore: 'snes',
    romUrl: `${CLOUDFLARE_R2_BASE}/Super Mario World (U) [!].smc`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/super-mario-world.jpg`,
    isHeavy: false,
  },
  'snes-donkey-kong': {
    id: 'snes-donkey-kong',
    title: 'Donkey Kong Country',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/Donkey Kong Country (U) (V1.2) [!].smc`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/super-mario-world.jpg`,
    isHeavy: false,
  },
  'md-sonic-2': {
    id: 'md-sonic-2',
    title: 'Sonic The Hedgehog 2',
    system: 'MEGADRIVE',
    sizeMb: 1.0,
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGADRIVE/Sonic The Hedgehog 2 (W) (REV01) [!].md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/super-mario-world.jpg`,
    isHeavy: false,
  }
};

const USERS_DB = {
  'user_free_123': {
    id: 'user_free_123',
    name: 'Gamer Gratuito',
    isVip: false,
    secondsRemainingToday: 7200,
    adBoostsUsedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  },
};

function checkDailyReset(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    user.lastResetDate = today;
    user.secondsRemainingToday = user.isVip ? 999999 : 7200;
    user.adBoostsUsedToday = 0;
  }
}

function proxyRomStream(targetUrl, req, res, maxRedirects = 5) {
  if (maxRedirects === 0) {
    console.error('[PROXY ERROR] Excedido limite de redirecionamentos');
    return res.status(500).json({ error: 'Muitos redirecionamentos no servidor R2.' });
  }

  let parsedUrl;
  try {
    // Limpa codificação dupla de caracteres (%2520 -> %20)
    let cleanUrl = targetUrl;
    try {
      cleanUrl = decodeURIComponent(targetUrl);
    } catch (e) {
      cleanUrl = targetUrl;
    }
    parsedUrl = new URL(cleanUrl);
  } catch (e) {
    console.error(`[PROXY ERROR] URL inválida: ${targetUrl}`);
    return res.status(400).json({ error: 'URL da ROM inválida.' });
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
      const redirectUrl = new URL(remoteRes.headers.location, targetUrl).href;
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
  console.log(`[PROXY REQUEST ${req.method}]: ${targetUrl}`);

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL da ROM não informada.' });
  }

  proxyRomStream(targetUrl, req, res);
});

app.get('/api/user/session-check', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_free_123';
  const user = USERS_DB[userId] || USERS_DB['user_free_123'];
  checkDailyReset(user);
  return res.json({
    userId: user.id,
    isVip: user.isVip,
    secondsRemainingToday: user.secondsRemainingToday,
    adBoostsUsedToday: user.adBoostsUsedToday,
    maxAdBoostsAllowed: 3,
    canWatchAdForMoreTime: !user.isVip && user.adBoostsUsedToday < 3,
  });
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
  console.log(`☁️ SERVIDOR CONECTADO AO CLOUDFLARE R2 PRÓPRIO!`);
  console.log(`===================================================`);
});
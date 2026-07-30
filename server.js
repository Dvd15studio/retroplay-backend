/**
 * =============================================================================
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 * Servidor de Teste Único com Proxy para Archive.org
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

// Configuração de CORS Global
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Range', 'User-Agent']
}));

app.use(express.json());

// Rota de Healthcheck / Status do Servidor
app.get('/', (req, res) => {
  return res.send('🚀 RETROPLAY BACKEND ONLINE!');
});

// CATÁLOGO DE TESTE: APENAS 1 JOGO (Archive.org)
const GAME_CATALOG = {
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 0.5,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/snes-romset-ultrasteve/Super%20Mario%20World%20%28USA%20%28En%29%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg',
    isHeavy: false,
  }
};

// Proxy para repassar o arquivo da ROM do Archive.org ao navegador
function proxyRomStream(targetUrl, req, res, maxRedirects = 5) {
  if (maxRedirects === 0) {
    console.error('[PROXY ERROR] Excedido limite de redirecionamentos');
    return res.status(500).json({ error: 'Muitos redirecionamentos.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    console.error(`[PROXY ERROR] URL inválida: ${targetUrl}`);
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
    // Trata redirecionamentos comuns do Archive.org (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(remoteRes.statusCode) && remoteRes.headers.location) {
      const redirectUrl = new URL(remoteRes.headers.location, targetUrl).href;
      console.log(`[PROXY REDIRECT ${remoteRes.statusCode}] -> ${redirectUrl}`);
      return proxyRomStream(redirectUrl, req, res, maxRedirects - 1);
    }

    if (remoteRes.statusCode < 200 || remoteRes.statusCode >= 400) {
      console.error(`[PROXY ERROR] HTTP ${remoteRes.statusCode} para ${targetUrl}`);
      return res.status(remoteRes.statusCode).json({ error: `Servidor retornou HTTP ${remoteRes.statusCode}` });
    }

    res.status(remoteRes.statusCode);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (remoteRes.headers['content-type']) res.setHeader('Content-Type', remoteRes.headers['content-type']);
    if (remoteRes.headers['content-length']) res.setHeader('Content-Length', remoteRes.headers['content-length']);
    if (remoteRes.headers['content-range']) res.setHeader('Content-Range', remoteRes.headers['content-range']);
    if (remoteRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', remoteRes.headers['accept-ranges']);

    if (req.method === 'HEAD') {
      return res.end();
    }

    remoteRes.pipe(res);
  });

  remoteReq.on('error', (err) => {
    console.error('[PROXY EXCEPTION]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Erro no proxy.' });
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
  return res.json({
    userId: 'user_free_123',
    isVip: false,
    secondsRemainingToday: 7200,
    adBoostsUsedToday: 0,
    maxAdBoostsAllowed: 3,
    canWatchAdForMoreTime: true,
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
  console.log(`🚀 RETROPLAY BACKEND ONLINE NA PORTA: ${PORT}`);
});
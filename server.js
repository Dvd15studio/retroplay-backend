/**
 * =============================================================================
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 * Proxy de ROMs com Suporte a Stream Nativo, Seguidor de Redirecionamentos (301/302),
 * Headers de CORS e Catálogo Validado.
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

// Configuração de CORS completa
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id']
}));
app.options('*', cors());

app.use(express.json());

// Rota de Healthcheck / Status do Servidor
app.get('/', (req, res) => {
  return res.send('🚀 RETROPLAY BACKEND ONLINE!');
});

// Catálogo com capas oficiais do IGDB e links de ROMs validados no Internet Archive
const GAME_CATALOG = {
  // ================= SNES =================
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 1.2,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/super-mario-world-usa/Super%20Mario%20World%20%28USA%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg',
    isHeavy: false,
  },
  'snes-mario-allstars': {
    id: 'snes-mario-allstars',
    title: 'Super Mario All-Stars',
    system: 'SNES',
    sizeMb: 1.5,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/super-mario-all-stars-usa/Super%20Mario%20All-Stars%20%28USA%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204m.jpg',
    isHeavy: false,
  },
  'snes-dk-country-1': {
    id: 'snes-dk-country-1',
    title: 'Donkey Kong Country',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/donkey-kong-country-usa-v1.2/Donkey%20Kong%20Country%20%28USA%29%20%28v1.2%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22tw.jpg',
    isHeavy: false,
  },
  'snes-dk-country-2': {
    id: 'snes-dk-country-2',
    title: 'Donkey Kong Country 2: Diddy\'s Kong Quest',
    system: 'SNES',
    sizeMb: 4.2,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/donkey-kong-country-2-diddys-kong-quest-usa-v1.1/Donkey%20Kong%20Country%202%20-%20Diddy%27s%20Kong%20Quest%20%28USA%29%20%28v1.1%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22tx.jpg',
    isHeavy: false,
  },
  'snes-dk-country-3': {
    id: 'snes-dk-country-3',
    title: 'Donkey Kong Country 3: Dixie Kong\'s Double Trouble!',
    system: 'SNES',
    sizeMb: 4.5,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/donkey-kong-country-3-dixie-kongs-double-trouble-usa/Donkey%20Kong%20Country%203%20-%20Dixie%20Kong%27s%20Double%20Trouble%21%20%28USA%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22ty.jpg',
    isHeavy: false,
  },
  'snes-mario-kart': {
    id: 'snes-mario-kart',
    title: 'Super Mario Kart',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/super-mario-kart-usa/Super%20Mario%20Kart%20%28USA%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7f.jpg',
    isHeavy: false,
  },
  'snes-chrono-trigger': {
    id: 'snes-chrono-trigger',
    title: 'Chrono Trigger',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://archive.org/download/chrono-trigger-usa/Chrono%20Trigger%20%28USA%29.sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204b.jpg',
    isHeavy: false,
  },

  // ================= N64 =================
  'n64-mario-64': {
    id: 'n64-mario-64',
    title: 'Super Mario 64',
    system: 'N64',
    sizeMb: 8.0,
    ejsCore: 'n64',
    romUrl: 'https://archive.org/download/super-mario-64-usa/Super%20Mario%2064%20%28USA%29.z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204h.jpg',
    isHeavy: true,
  },
  'n64-mario-kart-64': {
    id: 'n64-mario-kart-64',
    title: 'Mario Kart 64',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://archive.org/download/mario-kart-64-usa-v1.1/Mario%20Kart%2064%20%28USA%29%20%28v1.1%29.z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7e.jpg',
    isHeavy: true,
  },
  'n64-007-goldeneye': {
    id: 'n64-007-goldeneye',
    title: '007: GoldenEye',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://archive.org/download/golden-eye-007-usa/GoldenEye%20007%20%28USA%29.z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204p.jpg',
    isHeavy: true,
  },
  'n64-zelda-oot': {
    id: 'n64-zelda-oot',
    title: 'Zelda: Ocarina of Time',
    system: 'N64',
    sizeMb: 32.0,
    ejsCore: 'n64',
    romUrl: 'https://archive.org/download/legend-of-zelda-the-ocarina-of-time-usa-v1.2/Legend%20of%20Zelda%2C%20The%20-%20Ocarina%20of%20Time%20%28USA%29%20%28v1.2%29.z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vcp.jpg',
    isHeavy: true,
  },

  // ================= PS1 =================
  'ps1-harvest-moon': {
    id: 'ps1-harvest-moon',
    title: 'Harvest Moon: Back to Nature',
    system: 'PS1',
    sizeMb: 75.0,
    ejsCore: 'psx',
    romUrl: 'https://archive.org/download/harvest-moon-back-to-nature-usa/Harvest%20Moon%20-%20Back%20to%20Nature%20%28USA%29.chd',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p9.jpg',
    isHeavy: true,
  },
  'ps1-resident-evil-1': {
    id: 'ps1-resident-evil-1',
    title: 'Resident Evil Director\'s Cut',
    system: 'PS1',
    sizeMb: 380.0,
    ejsCore: 'psx',
    romUrl: 'https://archive.org/download/resident-evil-directors-cut-usa/Resident%20Evil%20-%20Director%27s%20Cut%20%28USA%29.chd',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204n.jpg',
    isHeavy: true,
  },

  // ================= PSP =================
  'psp-god-of-war': {
    id: 'psp-god-of-war',
    title: 'God of War: Chains of Olympus',
    system: 'PSP',
    sizeMb: 850.0,
    ejsCore: 'psp',
    romUrl: 'https://archive.org/download/god-of-war-chains-of-olympus-usa/God%20of%20War%20-%20Chains%20of%20Olympus%20%28USA%29.cso',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204l.jpg',
    isHeavy: true,
  },
};

// Banco de Dados em Memória (Sessões e Saves)
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

const SAVES_DB = {};

function checkDailyReset(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    user.lastResetDate = today;
    user.secondsRemainingToday = user.isVip ? 999999 : 7200;
    user.adBoostsUsedToday = 0;
  }
}

/**
 * Função Auxiliar de Proxy com Suporte Nativo a Redirecionamentos (301/302) e Streaming
 */
function fetchStreamWithRedirects(targetUrl, res, maxRedirects = 5) {
  if (maxRedirects === 0) {
    console.error('[PROXY ERROR] Excedido limite de redirecionamentos');
    return res.status(500).json({ error: 'Muitos redirecionamentos no servidor remoto.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    console.error(`[PROXY ERROR] URL inválida: ${targetUrl}`);
    return res.status(400).json({ error: 'URL da ROM inválida.' });
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;

  const requestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
  };

  const req = client.request(requestOptions, (remoteRes) => {
    // Trata Redirecionamentos HTTP 301, 302, 303, 307, 308
    if ([301, 302, 303, 307, 308].includes(remoteRes.statusCode) && remoteRes.headers.location) {
      const redirectUrl = new URL(remoteRes.headers.location, targetUrl).href;
      console.log(`[PROXY REDIRECT ${remoteRes.statusCode}] -> ${redirectUrl}`);
      return fetchStreamWithRedirects(redirectUrl, res, maxRedirects - 1);
    }

    if (remoteRes.statusCode < 200 || remoteRes.statusCode >= 300) {
      console.error(`[PROXY ERROR] HTTP ${remoteRes.statusCode} ao baixar: ${targetUrl}`);
      return res.status(remoteRes.statusCode).json({ error: `Falha ao baixar ROM (${remoteRes.statusCode})` });
    }

    // Define Headers de Resposta para o Navegador
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', remoteRes.headers['content-type'] || 'application/octet-stream');
    if (remoteRes.headers['content-length']) {
      res.setHeader('Content-Length', remoteRes.headers['content-length']);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Transmite os bytes por Stream diretamente sem estourar a memória RAM
    remoteRes.pipe(res);
  });

  req.on('error', (err) => {
    console.error('[PROXY EXCEPTION]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Erro na transmissão do proxy.' });
    }
  });

  req.end();
}

// ROTA PROXY COM STREAMING E REDIRECT
app.get('/api/proxy-rom', (req, res) => {
  const targetUrl = req.query.url;
  console.log('===================================================');
  console.log('[PROXY REQUEST RECEIVED]:', targetUrl);

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL da ROM não informada.' });
  }

  fetchStreamWithRedirects(targetUrl, res);
});

// REST APIs
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

app.post('/api/user/reward-ad', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_free_123';
  const user = USERS_DB[userId] || USERS_DB['user_free_123'];
  checkDailyReset(user);
  user.secondsRemainingToday += 1200;
  user.adBoostsUsedToday += 1;
  return res.json({
    message: '+20 minutos adicionados com sucesso!',
    secondsRemainingToday: user.secondsRemainingToday,
    adBoostsUsedToday: user.adBoostsUsedToday,
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

app.post('/api/games/:id/download-url', (req, res) => {
  const game = GAME_CATALOG[req.params.id] || GAME_CATALOG['snes-mario-world'];
  return res.json({
    gameId: game.id,
    gameTitle: game.title,
    downloadUrl: game.romUrl,
    expiresInSeconds: 3600,
  });
});

app.get('/api/saves/:gameId', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_free_123';
  const key = `${userId}_${req.params.gameId}`;
  return res.json({
    gameId: req.params.gameId,
    slots: SAVES_DB[key] || [null, null, null],
  });
});

app.post('/api/saves/:gameId/slot/:slotIndex', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_free_123';
  const gameId = req.params.gameId;
  const slotIndex = parseInt(req.params.slotIndex, 10);
  const key = `${userId}_${gameId}`;
  if (!SAVES_DB[key]) SAVES_DB[key] = [null, null, null];

  SAVES_DB[key][slotIndex] = {
    slot: slotIndex + 1,
    savedAt: new Date().toISOString(),
    label: `Fase Salva (${new Date().toLocaleTimeString()})`,
  };

  return res.json({
    message: `Progresso salvo no Slot ${slotIndex + 1}!`,
    saveSlot: SAVES_DB[key][slotIndex],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 RETROPLAY BACKEND ONLINE NA PORTA: ${PORT}`);
  console.log(`===================================================`);
});
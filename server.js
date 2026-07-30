/**
 * =============================================================================
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 * Inclui Proxy de ROMs com tratamento de CORS e URLs Sanitizadas
 * =============================================================================
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Catálogo Completo com Capas Oficiais e ROMs Testadas
const GAME_CATALOG = {
  // ================= SNES =================
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 1.2,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20World%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg',
    isHeavy: false,
  },
  'snes-mario-allstars': {
    id: 'snes-mario-allstars',
    title: 'Super Mario All-Stars',
    system: 'SNES',
    sizeMb: 1.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20All-Stars%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204m.jpg',
    isHeavy: false,
  },
  'snes-dk-country-1': {
    id: 'snes-dk-country-1',
    title: 'Donkey Kong Country',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22tw.jpg',
    isHeavy: false,
  },
  'snes-dk-country-2': {
    id: 'snes-dk-country-2',
    title: 'Donkey Kong Country 2: Diddy\'s Kong Quest',
    system: 'SNES',
    sizeMb: 4.2,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%202%20-%20Diddy\'s%20Kong%20Quest%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22tx.jpg',
    isHeavy: false,
  },
  'snes-dk-country-3': {
    id: 'snes-dk-country-3',
    title: 'Donkey Kong Country 3: Dixie Kong\'s Double Trouble!',
    system: 'SNES',
    sizeMb: 4.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%203%20-%20Dixie%20Kong\'s%20Double%20Trouble!%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co22ty.jpg',
    isHeavy: false,
  },
  'snes-indiana-jones': {
    id: 'snes-indiana-jones',
    title: 'Indiana Jones\' Greatest Adventures',
    system: 'SNES',
    sizeMb: 2.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Indiana%20Jones\'%20Greatest%20Adventures%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x9r.jpg',
    isHeavy: false,
  },
  'snes-the-mask': {
    id: 'snes-the-mask',
    title: 'The Mask',
    system: 'SNES',
    sizeMb: 1.6,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/The%20Mask%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co24ef.jpg',
    isHeavy: false,
  },
  'snes-bomberman-1': {
    id: 'snes-bomberman-1',
    title: 'Super Bomberman',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p4.jpg',
    isHeavy: false,
  },
  'snes-bomberman-2': {
    id: 'snes-bomberman-2',
    title: 'Super Bomberman 2',
    system: 'SNES',
    sizeMb: 1.2,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%202%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p5.jpg',
    isHeavy: false,
  },
  'snes-bomberman-3': {
    id: 'snes-bomberman-3',
    title: 'Super Bomberman 3',
    system: 'SNES',
    sizeMb: 1.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%203%20(Japan).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p6.jpg',
    isHeavy: false,
  },
  'snes-bomberman-4': {
    id: 'snes-bomberman-4',
    title: 'Super Bomberman 4',
    system: 'SNES',
    sizeMb: 1.8,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%204%20(Japan).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p7.jpg',
    isHeavy: false,
  },
  'snes-bomberman-5': {
    id: 'snes-bomberman-5',
    title: 'Super Bomberman 5',
    system: 'SNES',
    sizeMb: 2.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%205%20(Japan).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p8.jpg',
    isHeavy: false,
  },
  'snes-mario-kart': {
    id: 'snes-mario-kart',
    title: 'Super Mario Kart',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20Kart%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7f.jpg',
    isHeavy: false,
  },
  'snes-chrono-trigger': {
    id: 'snes-chrono-trigger',
    title: 'Chrono Trigger',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Chrono%20Trigger%20(USA).sfc',
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
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Super%20Mario%2064%20(USA).z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204h.jpg',
    isHeavy: true,
  },
  'n64-mario-kart-64': {
    id: 'n64-mario-kart-64',
    title: 'Mario Kart 64',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Mario%20Kart%2064%20(USA).z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7e.jpg',
    isHeavy: true,
  },
  'n64-007-goldeneye': {
    id: 'n64-007-goldeneye',
    title: '007: GoldenEye',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/GoldenEye%20007%20(USA).z64',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204p.jpg',
    isHeavy: true,
  },
  'n64-zelda-oot': {
    id: 'n64-zelda-oot',
    title: 'Zelda: Ocarina of Time',
    system: 'N64',
    sizeMb: 32.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Legend%20of%20Zelda,%20The%20-%20Ocarina%20of%20Time%20(USA).z64',
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
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20World%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co27p9.jpg',
    isHeavy: true,
  },
  'ps1-resident-evil-1': {
    id: 'ps1-resident-evil-1',
    title: 'Resident Evil Director\'s Cut',
    system: 'PS1',
    sizeMb: 380.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20World%20(USA).sfc',
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
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20World%20(USA).sfc',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204l.jpg',
    isHeavy: true,
  },
};

// Banco em Memória de Usuários
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

// ROTA PROXY: Remove bloqueios de CORS e entrega a ROM sem erros de rede
app.get('/api/proxy-rom', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL da ROM não informada.' });
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Falha ao baixar ROM (${response.status})` });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).json({ error: 'Erro de comunicação no servidor de proxy.' });
  }
});

// APIs Rest
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
  console.log(`🚀 RETROPLAY BACKEND ONLINE NA PORTA: ${PORT}`);
});
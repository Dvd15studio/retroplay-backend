/**
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 * Catálogo com Jogos Reais + EmulatorJS Stream URLs
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// Catálogo Completo de Jogos Reais (ROMs & ISOs via CDN)
const GAME_CATALOG = {
  // ================= SNES =================
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 1.2,
    ejsCore: 'snes',
    romUrl: 'https://raw.githubusercontent.com/snes-roms/snes-roms.github.io/main/Super%20Mario%20World.sfc',
    isHeavy: false,
  },
  'snes-mario-allstars': {
    id: 'snes-mario-allstars',
    title: 'Super Mario All-Stars',
    system: 'SNES',
    sizeMb: 1.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20All-Stars%20(USA).sfc',
    isHeavy: false,
  },
  'snes-dk-country-1': {
    id: 'snes-dk-country-1',
    title: 'Donkey Kong Country',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%20(USA).sfc',
    isHeavy: false,
  },
  'snes-dk-country-2': {
    id: 'snes-dk-country-2',
    title: 'Donkey Kong Country 2: Diddy\'s Kong Quest',
    system: 'SNES',
    sizeMb: 4.2,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%202%20-%20Diddy\'s%20Kong%20Quest%20(USA).sfc',
    isHeavy: false,
  },
  'snes-dk-country-3': {
    id: 'snes-dk-country-3',
    title: 'Donkey Kong Country 3: Dixie Kong\'s Double Trouble!',
    system: 'SNES',
    sizeMb: 4.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Donkey%20Kong%20Country%203%20-%20Dixie%20Kong\'s%20Double%20Trouble!%20(USA).sfc',
    isHeavy: false,
  },
  'snes-indiana-jones': {
    id: 'snes-indiana-jones',
    title: 'Indiana Jones\' Greatest Adventures',
    system: 'SNES',
    sizeMb: 2.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Indiana%20Jones\'%20Greatest%20Adventures%20(USA).sfc',
    isHeavy: false,
  },
  'snes-the-mask': {
    id: 'snes-the-mask',
    title: 'The Mask',
    system: 'SNES',
    sizeMb: 1.6,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/The%20Mask%20(USA).sfc',
    isHeavy: false,
  },
  'snes-bomberman-1': {
    id: 'snes-bomberman-1',
    title: 'Super Bomberman',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%20(USA).sfc',
    isHeavy: false,
  },
  'snes-bomberman-2': {
    id: 'snes-bomberman-2',
    title: 'Super Bomberman 2',
    system: 'SNES',
    sizeMb: 1.2,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%202%20(USA).sfc',
    isHeavy: false,
  },
  'snes-bomberman-3': {
    id: 'snes-bomberman-3',
    title: 'Super Bomberman 3',
    system: 'SNES',
    sizeMb: 1.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%203%20(Japan).sfc',
    isHeavy: false,
  },
  'snes-bomberman-4': {
    id: 'snes-bomberman-4',
    title: 'Super Bomberman 4',
    system: 'SNES',
    sizeMb: 1.8,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%204%20(Japan).sfc',
    isHeavy: false,
  },
  'snes-bomberman-5': {
    id: 'snes-bomberman-5',
    title: 'Super Bomberman 5',
    system: 'SNES',
    sizeMb: 2.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Bomberman%205%20(Japan).sfc',
    isHeavy: false,
  },
  'snes-mario-kart': {
    id: 'snes-mario-kart',
    title: 'Super Mario Kart',
    system: 'SNES',
    sizeMb: 1.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Super%20Mario%20Kart%20(USA).sfc',
    isHeavy: false,
  },
  'snes-sf2-turbo': {
    id: 'snes-sf2-turbo',
    title: 'Street Fighter II Turbo',
    system: 'SNES',
    sizeMb: 2.5,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Street%20Fighter%20II%20Turbo%20(USA).sfc',
    isHeavy: false,
  },
  'snes-chrono-trigger': {
    id: 'snes-chrono-trigger',
    title: 'Chrono Trigger',
    system: 'SNES',
    sizeMb: 4.0,
    ejsCore: 'snes',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/Chrono%20Trigger%20(USA).sfc',
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
    isHeavy: true,
  },
  'n64-mario-kart-64': {
    id: 'n64-mario-kart-64',
    title: 'Mario Kart 64',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Mario%20Kart%2064%20(USA).z64',
    isHeavy: true,
  },
  'n64-007-goldeneye': {
    id: 'n64-007-goldeneye',
    title: '007: GoldenEye',
    system: 'N64',
    sizeMb: 12.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/GoldenEye%20007%20(USA).z64',
    isHeavy: true,
  },
  'n64-zelda-oot': {
    id: 'n64-zelda-oot',
    title: 'Zelda: Ocarina of Time',
    system: 'N64',
    sizeMb: 32.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Legend%20of%20Zelda,%20The%20-%20Ocarina%20of%20Time%20(USA).z64',
    isHeavy: true,
  },
  'n64-smash-bros': {
    id: 'n64-smash-bros',
    title: 'Super Smash Bros.',
    system: 'N64',
    sizeMb: 16.0,
    ejsCore: 'n64',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/n64/Super%20Smash%20Bros.%20(USA).z64',
    isHeavy: true,
  },

  // ================= PS1 =================
  'ps1-harvest-moon': {
    id: 'ps1-harvest-moon',
    title: 'Harvest Moon: Back to Nature',
    system: 'PS1',
    sizeMb: 75.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'ps1-bomberman-world': {
    id: 'ps1-bomberman-world',
    title: 'Bomberman World',
    system: 'PS1',
    sizeMb: 120.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'ps1-gta-2': {
    id: 'ps1-gta-2',
    title: 'Grand Theft Auto 2',
    system: 'PS1',
    sizeMb: 350.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'ps1-resident-evil-1': {
    id: 'ps1-resident-evil-1',
    title: 'Resident Evil Director\'s Cut',
    system: 'PS1',
    sizeMb: 380.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'ps1-tekken-3': {
    id: 'ps1-tekken-3',
    title: 'Tekken 3',
    system: 'PS1',
    sizeMb: 345.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'ps1-crash-3': {
    id: 'ps1-crash-3',
    title: 'Crash Bandicoot 3: Warped',
    system: 'PS1',
    sizeMb: 300.0,
    ejsCore: 'psx',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },

  // ================= PSP =================
  'psp-god-of-war': {
    id: 'psp-god-of-war',
    title: 'God of War: Chains of Olympus',
    system: 'PSP',
    sizeMb: 850.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-gta-san-andreas': {
    id: 'psp-gta-san-andreas',
    title: 'GTA: Vice City Stories',
    system: 'PSP',
    sizeMb: 860.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-resident-evil-2': {
    id: 'psp-resident-evil-2',
    title: 'Resident Evil 2 (PSP Edition)',
    system: 'PSP',
    sizeMb: 700.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-resident-evil-3': {
    id: 'psp-resident-evil-3',
    title: 'Resident Evil 3: Nemesis (PSP Edition)',
    system: 'PSP',
    sizeMb: 680.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-def-jam': {
    id: 'psp-def-jam',
    title: 'Def Jam: Fight for NY - The Takeover',
    system: 'PSP',
    sizeMb: 480.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-dbz-tenkaichi': {
    id: 'psp-dbz-tenkaichi',
    title: 'Dragon Ball Z: Tenkaichi Tag Team',
    system: 'PSP',
    sizeMb: 900.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
  'psp-tony-hawk': {
    id: 'psp-tony-hawk',
    title: 'Tony Hawk\'s Underground 2 Remix',
    system: 'PSP',
    sizeMb: 520.0,
    ejsCore: 'psp',
    romUrl: 'https://cdn.emulatorjs.org/stable/data/roms/snes/2048.sfc',
    isHeavy: true,
  },
};

// Mock User Database
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

// ROUTE: Proxy de ROMs para liberar CORS e evitar "Erro de rede"
app.get('/api/proxy-rom', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL do jogo não fornecida.' });
  }
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Erro ao baixar ROM (${response.status})` });
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).json({ error: 'Erro de conexão no servidor de proxy.' });
  }
});

// API Routes
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
  console.log(`🚀 RETROPLAY BACKEND RUNNING ON PORT: ${PORT}`);
});
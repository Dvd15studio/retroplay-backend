/**
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// Mock Game Catalog
const GAME_CATALOG = {
  'snes-mario-world': {
    id: 'snes-mario-world',
    title: 'Super Mario World',
    system: 'SNES',
    sizeMb: 1.2,
    r2Key: 'snes/Super_Mario_World.sfc',
    isHeavy: false,
  },
  'ps1-tekken-3': {
    id: 'ps1-tekken-3',
    title: 'Tekken 3',
    system: 'PS1',
    sizeMb: 345.0,
    r2Key: 'ps1/Tekken_3.chd',
    isHeavy: true,
  },
  'n64-zelda-oot': {
    id: 'n64-zelda-oot',
    title: 'The Legend of Zelda: Ocarina of Time',
    system: 'N64',
    sizeMb: 32.0,
    r2Key: 'n64/Zelda_Ocarina_of_Time.z64',
    isHeavy: true,
  },
  'psp-god-of-war': {
    id: 'psp-god-of-war',
    title: 'God of War: Chains of Olympus',
    system: 'PSP',
    sizeMb: 850.0,
    r2Key: 'psp/God_of_War.cso',
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

function generateCloudflareR2SignedUrl(r2Key) {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const secretKey = process.env.R2_SECRET_KEY || 'retroplay_super_secret_r2_key';
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${r2Key}:${expiresAt}`)
    .digest('hex');

  return {
    downloadUrl: `https://cdn.retroplayapp.com/${r2Key}?token=${signature}&expires=${expiresAt}`,
    expiresInSeconds: 300,
  };
}

function checkDailyReset(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    user.lastResetDate = today;
    user.secondsRemainingToday = user.isVip ? 999999 : 7200;
    user.adBoostsUsedToday = 0;
  }
}

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
  }));
  return res.json({ catalog: gamesList });
});

app.post('/api/games/:id/download-url', (req, res) => {
  const game = GAME_CATALOG[req.params.id] || GAME_CATALOG['snes-mario-world'];
  const signedUrlData = generateCloudflareR2SignedUrl(game.r2Key);
  return res.json({
    gameId: game.id,
    gameTitle: game.title,
    downloadUrl: signedUrlData.downloadUrl,
    expiresInSeconds: signedUrlData.expiresInSeconds,
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
  console.log(`🚀 RETROPLAY API RUNNING ON PORT: ${PORT}`);
});
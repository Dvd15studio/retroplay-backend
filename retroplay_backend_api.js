/**
 * =============================================================================
 * RETROPLAY BACKEND API SERVER (Node.js + Express)
 * =============================================================================
 * Handles User Sessions, Cloudflare R2 Signed URLs, Daily Play Time Limits,
 * Ad Reward Verification, and Cloud Save State Management.
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Express App Setup
const app = express();
app.use(express.json());
app.use(cors());

// =============================================================================
// MOCK DATABASE & IN-MEMORY STORE
// =============================================================================

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
    secondsRemainingToday: 7200, // 2 hours initial limit
    adBoostsUsedToday: 0,        // Max 3 boosts (+20 min each)
    lastResetDate: new Date().toISOString().split('T')[0],
  },
  'user_vip_999': {
    id: 'user_vip_999',
    name: 'Gamer VIP',
    isVip: true,
    secondsRemainingToday: 999999, // Unlimited
    adBoostsUsedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  },
};

// Mock Save States Database
const SAVES_DB = {};

// =============================================================================
// CLOUDFLARE R2 SIGNED URL GENERATOR (SIMULATION)
// =============================================================================

function generateCloudflareR2SignedUrl(r2Key) {
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes expiration
  const secretKey = process.env.R2_SECRET_KEY || 'retroplay_super_secret_r2_key';
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${r2Key}:${expiresAt}`)
    .digest('hex');

  const signedUrl = `https://cdn.retroplayapp.com/${r2Key}?token=${signature}&expires=${expiresAt}`;

  return {
    downloadUrl: signedUrl,
    expiresInSeconds: 300,
  };
}

function checkDailyReset(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    user.lastResetDate = today;
    user.secondsRemainingToday = user.isVip ? 999999 : 7200; // Reset to 2h
    user.adBoostsUsedToday = 0;
  }
}

// =============================================================================
// API ROUTES: USER SESSIONS & DAILY TIME MANAGEMENT
// =============================================================================

app.get('/api/user/session-check', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'user_free_123';
    const user = USERS_DB[userId];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    checkDailyReset(user);

    return res.json({
      userId: user.id,
      isVip: user.isVip,
      secondsRemainingToday: user.secondsRemainingToday,
      adBoostsUsedToday: user.adBoostsUsedToday,
      maxAdBoostsAllowed: 3,
      canWatchAdForMoreTime: !user.isVip && user.adBoostsUsedToday < 3,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar sessão do usuário.' });
  }
});

app.post('/api/user/reward-ad', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'user_free_123';
    const user = USERS_DB[userId];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    checkDailyReset(user);

    if (user.isVip) {
      return res.status(400).json({ message: 'Usuários VIP possuem tempo ilimitado.' });
    }

    if (user.adBoostsUsedToday >= 3) {
      return res.status(403).json({
        error: 'Limite máximo diário de anúncios atingido (3/3). Tente novamente amanhã ou assine o VIP!',
      });
    }

    user.secondsRemainingToday += 1200;
    user.adBoostsUsedToday += 1;

    return res.json({
      message: '+20 minutos adicionados com sucesso!',
      secondsRemainingToday: user.secondsRemainingToday,
      adBoostsUsedToday: user.adBoostsUsedToday,
      maxAdBoostsAllowed: 3,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar recompensa de anúncio.' });
  }
});

// =============================================================================
// API ROUTES: GAME CATALOG & DOWNLOAD URLS
// =============================================================================

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
  try {
    const userId = req.headers['x-user-id'] || 'user_free_123';
    const gameId = req.params.id;
    const user = USERS_DB[userId];
    const game = GAME_CATALOG[gameId];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado no catálogo.' });
    }

    checkDailyReset(user);

    if (!user.isVip && user.secondsRemainingToday <= 0) {
      return res.status(403).json({
        error: 'Seu tempo de jogo diário acabou. Assista a um anúncio para liberar mais 20 minutos ou seja VIP.',
      });
    }

    const signedUrlData = generateCloudflareR2SignedUrl(game.r2Key);

    return res.json({
      gameId: game.id,
      gameTitle: game.title,
      downloadUrl: signedUrlData.downloadUrl,
      expiresInSeconds: signedUrlData.expiresInSeconds,
      fileSizeBytes: game.sizeMb * 1024 * 1024,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar link de download do jogo.' });
  }
});

// =============================================================================
// API ROUTES: SAVE STATE MANAGEMENT
// =============================================================================

app.get('/api/saves/:gameId', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_free_123';
  const gameId = req.params.gameId;
  const key = `${userId}_${gameId}`;

  const userSaves = SAVES_DB[key] || [null, null, null];

  return res.json({
    gameId: gameId,
    slots: userSaves,
    maxSlotsAllowed: USERS_DB[userId]?.isVip ? 99 : 3,
  });
});

app.post('/api/saves/:gameId/slot/:slotIndex', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'user_free_123';
    const gameId = req.params.gameId;
    const slotIndex = parseInt(req.params.slotIndex, 10);
    const { stateData, adVerified } = req.body;
    const user = USERS_DB[userId];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!user.isVip && (slotIndex < 0 || slotIndex >= 3)) {
      return res.status(403).json({
        error: 'Usuários gratuitos possuem limite de 3 slots de salvamento.',
      });
    }

    if (!user.isVip && !adVerified) {
      return res.status(402).json({
        error: 'É necessário visualizar um anúncio curto antes de salvar o progresso.',
      });
    }

    const key = `${userId}_${gameId}`;
    if (!SAVES_DB[key]) {
      SAVES_DB[key] = [null, null, null];
    }

    SAVES_DB[key][slotIndex] = {
      slot: slotIndex + 1,
      savedAt: new Date().toISOString(),
      label: `Fase Salva (${new Date().toLocaleTimeString()})`,
      stateData: stateData || 'BINARY_STATE_DATA_MOCK',
    };

    return res.json({
      message: `Progresso salvo com sucesso no Slot ${slotIndex + 1}!`,
      saveSlot: SAVES_DB[key][slotIndex],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar o progresso.' });
  }
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 RETROPLAY API RUNNING ON PORT: ${PORT}`);
  console.log(`📡 Cloudflare R2 Signed URLs: ENABLED`);
  console.log(`⏱️ Free Tier Time Tracker (2h/day): ENABLED`);
  console.log(`===================================================`);
});
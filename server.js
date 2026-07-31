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
  return res.send('🚀 RETROPLAY BACKEND ONLINE - CATÁLOGO COMPLETO DO CLOUDFLARE R2 PRONTO!');
});

const CLOUDFLARE_R2_BASE = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

const GAME_CATALOG = {
  // ==========================================
  // NINTENDO (NES)
  // ==========================================
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
  'nes-zelda-2': {
    id: 'nes-zelda-2',
    title: 'Zelda II - The Adventure of Link',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Zelda%20II%20-%20The%20Adventure%20of%20Link%20(USA).nes`,
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
  'nes-castlevania-2': {
    id: 'nes-castlevania-2',
    title: 'Castlevania II - Simon\'s Quest',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Castlevania%20II%20-%20Simon's%20Quest%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Castlevania%20II%20-%20Simon's%20Quest%20(USA).png`,
  },
  'nes-contra': {
    id: 'nes-contra',
    title: 'Super C (Contra II)',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Super%20C%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Super%20C%20(USA).png`,
  },
  'nes-contra-force': {
    id: 'nes-contra-force',
    title: 'Contra Force',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Contra%20Force%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Contra%20Force%20(USA).png`,
  },
  'nes-donkey-kong': {
    id: 'nes-donkey-kong',
    title: 'Donkey Kong',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Donkey%20Kong%20(World)%20(Rev%20A).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Donkey%20Kong%20(World)%20(Rev%20A).png`,
  },
  'nes-double-dragon-1': {
    id: 'nes-double-dragon-1',
    title: 'Double Dragon',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Double%20Dragon%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Double%20Dragon%20III%20-%20The%20Sacred%20Stones%20(USA).png`,
  },
  'nes-mega-man-2': {
    id: 'nes-mega-man-2',
    title: 'Mega Man 2',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Mega%20Man%202%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Mega%20Man%202%20(USA).png`,
  },
  'nes-mega-man-6': {
    id: 'nes-mega-man-6',
    title: 'Mega Man 6',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Mega%20Man%206%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Mega%20Man%206%20(USA).png`,
  },
  'nes-ninja-gaiden': {
    id: 'nes-ninja-gaiden',
    title: 'Ninja Gaiden',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Ninja%20Gaiden%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Ninja%20Gaiden%20(USA).png`,
  },
  'nes-tmnt': {
    id: 'nes-tmnt',
    title: 'Teenage Mutant Ninja Turtles',
    system: 'NES',
    ejsCore: 'nes',
    romUrl: `${CLOUDFLARE_R2_BASE}/SNES/ROMS/Teenage%20Mutant%20Ninja%20Turtles%20(USA).nes`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/SNES/CAPAS/Teenage%20Mutant%20Ninja%20Turtles%20-%20Tournament%20Fighters%20(USA).png`,
  },

  // ==========================================
  // MEGA DRIVE (SEGA)
  // ==========================================
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
  'md-jungle-book': {
    id: 'md-jungle-book',
    title: 'Disney\'s The Jungle Book',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Disney's%20The%20Jungle%20Book.smd`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Disney's%20The%20Jungle%20Book.png`,
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
  'md-sonic-3': {
    id: 'md-sonic-3',
    title: 'Sonic & Knuckles + Sonic 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Sonic%20%26%20Knuckles%20%2B%20Sonic%20The%20Hedgehog%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Sonic%20%26%20Knuckles%20%2B%20Sonic%20The%20Hedgehog%203%20(USA).png`,
  },
  'md-streets-rage-1': {
    id: 'md-streets-rage-1',
    title: 'Streets of Rage',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Bare%20Knuckle%20-%20Ikari%20no%20Tekken%20~%20Streets%20of%20Rage%20(World)%20(Rev%20A).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Streets%20Of%20Rage%20I.png`,
  },
  'md-streets-rage-2': {
    id: 'md-streets-rage-2',
    title: 'Streets of Rage 2',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Streets%20of%20Rage%202%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Streets%20Of%20Rage%20II.png`,
  },
  'md-streets-rage-3': {
    id: 'md-streets-rage-3',
    title: 'Streets of Rage 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Streets%20of%20Rage%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Streets%20Of%20Rage%20III.png`,
  },
  'md-mortal-kombat-1': {
    id: 'md-mortal-kombat-1',
    title: 'Mortal Kombat',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Mortal%20Kombat%20(World).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Mortal%20Kombat%20I.png`,
  },
  'md-mortal-kombat-2': {
    id: 'md-mortal-kombat-2',
    title: 'Mortal Kombat II',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Mortal%20Kombat%20II%20(World).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Mortal%20Kombat%20II.png`,
  },
  'md-mortal-kombat-3': {
    id: 'md-mortal-kombat-3',
    title: 'Mortal Kombat 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Mortal%20Kombat%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Mortal%20Kombat%203%20(USA).png`,
  },
  'md-umk-3': {
    id: 'md-umk-3',
    title: 'Ultimate Mortal Kombat 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Ultimate%20Mortal%20Kombat%203%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Ultimate%20Mortal%20Kombat%203%20(USA).png`,
  },
  'md-earthworm-jim-1': {
    id: 'md-earthworm-jim-1',
    title: 'Earthworm Jim',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Earthworm%20Jim%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Earthworm%20Jim%20I.png`,
  },
  'md-earthworm-jim-2': {
    id: 'md-earthworm-jim-2',
    title: 'Earthworm Jim 2',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Earthworm%20Jim%202%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Earthworm%20Jim%20II.png`,
  },
  'md-golden-axe-1': {
    id: 'md-golden-axe-1',
    title: 'Golden Axe',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Golden%20Axe%20(World)%20(Rev%20A).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Golden%20Axe%20I.png`,
  },
  'md-golden-axe-2': {
    id: 'md-golden-axe-2',
    title: 'Golden Axe II',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Golden%20Axe%20II%20(World).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Golden%20Axe%20II%20(World).png`,
  },
  'md-golden-axe-3': {
    id: 'md-golden-axe-3',
    title: 'Golden Axe III',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Golden%20Axe%20III%20(Japan)%20(En).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Golden%20Axe%20III.png`,
  },
  'md-shinobi-3': {
    id: 'md-shinobi-3',
    title: 'Shinobi III - Return of the Ninja Master',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Shinobi%20III%20-%20Return%20of%20the%20Ninja%20Master%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Shinobi%20III%20-%20Return%20of%20the%20Ninja%20Master%20(USA).png`,
  },
  'md-tmnt-hyperstone': {
    id: 'md-tmnt-hyperstone',
    title: 'TMNT - The Hyperstone Heist',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Teenage%20Mutant%20Ninja%20Turtles%20-%20The%20Hyperstone%20Heist%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Teenage%20Mutant%20Ninja%20Turtles%20-%20The%20Hyperstone%20Heist%20(USA).png`,
  },
  'md-gunstar-heroes': {
    id: 'md-gunstar-heroes',
    title: 'Gunstar Heroes',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Gunstar%20Heroes%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Gunstar%20Heroes%20(USA).png`,
  },
  'md-vectorman-1': {
    id: 'md-vectorman-1',
    title: 'Vectorman',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Vectorman%20(USA%2C%20Europe).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Vectorman%20I.png`,
  },
  'md-vectorman-2': {
    id: 'md-vectorman-2',
    title: 'Vectorman 2',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Vectorman%202%20(USA).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Vectorman%202%20(USA).png`,
  },
  'md-road-rash-3': {
    id: 'md-road-rash-3',
    title: 'Road Rash 3',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/Road%20Rash%203%20(USA%2C%20Europe).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/Road%20Rash%203%20(USA%2C%20Europe).png`,
  },
  'md-xmen-2': {
    id: 'md-xmen-2',
    title: 'X-Men 2 - Clone Wars',
    system: 'MEGADRIVE',
    ejsCore: 'segaMD',
    romUrl: `${CLOUDFLARE_R2_BASE}/MEGA/ROMS/X-Men%202%20-%20Clone%20Wars%20(USA%2C%20Europe).md`,
    coverUrl: `${CLOUDFLARE_R2_BASE}/MEGA/CAPA/X-Men%202%20-%20Clone%20Wars%20(USA%2C%20Europe).png`,
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
  console.log(`🚀 RETROPLAY BACKEND ONLINE NA PORTA: ${PORT}`);
  console.log(`☁️ SERVIDOR CONECTADO AO CLOUDFLARE R2 PRÓPRIO!`);
  console.log(`===================================================`);
});
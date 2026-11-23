// =====================================================================
// level_flow.js — 關卡流程：startLevel（開始關卡）與退出關卡還原。
// =====================================================================

// 退出關卡回大地圖時還原進關前道具快照（避免重複刷道具）
function exitToWorldMapRestoreEntry() {
  lives = levelEntrySnapshot.lives;
  powerLevel = levelEntrySnapshot.powerLevel;
  powerType = levelEntrySnapshot.powerType;
  reservedItem = levelEntrySnapshot.reservedItem;
  coinCount = levelEntrySnapshot.coinCount;
  score = levelEntrySnapshot.score;
  mobileDashLocked = false;
  showSettingsModal = false;
  showExitMapConfirmModal = false;
  saved2_4MainState = null;
  initialW2L4Spawns = null;
  window.isInMinerSupplyRoom = false;
  gameState = "WORLD_MAP";
  playSFX("mapMove");
}

function startLevel(levelNum, resetRunStats, keepPowerup = false) {
  castleFlagRaised = false;
  castleFlagProgress = 0;
  flagDropY = 0;
  dashToggleActive = false;
  mobileDashLocked = false;
  safePositionHistory = [];
  currentLevel = levelNum;
  movingPlatforms = [];
  fireBars = [];
  boss = null;
  bossFireballs = [];
  bridgeCollapsing = false;
  transformTimer = 0;
  invincibleTimer = 0;
  starTimer = 0;
  currentSprintBonus = 0;
  knockbackVX = 0;
  mobileDashLocked = false;
  bumpingTiles = [];
  playerFireballs = [];
  enemies = [];
  levelTimer = 400;
  saved2_4MainState = null;
  initialW2L4Spawns = null;
  window.isInMinerSupplyRoom = false;

  if (currentWorld === 2) {
    is1_2Intro = false;
    isSecretClear = false;
    is2_1SubSecret = false;
    torchCount = 0;
    placedTorches = [];
    hasMinerHeadlamp = false;
    endClearBonusSmoke = [];
    wormRocks = [];
    playerStunTimer = 0;
    rescueCutscene = null;
    sandwormBoss = null;

    let useCheckpoint = (typeof checkpointState !== "undefined" && checkpointState.active && checkpointState.world === 2 && checkpointState.level === levelNum);
    let w2Data = buildWorld2Level(levelNum);
    levelTimer = w2Data.config.timeLimit;

    // 方案 E：進入 2-4 時先保存初始 spawn 副本（必須獨立於 !useCheckpoint 條件）
    if (levelNum === 4) {
      initialW2L4Spawns = {
        enemySpawns: (w2Data.enemySpawns || []).map(sp => ({ ...sp })),
        platformSpawns: (w2Data.platformSpawns || []).map(pl => ({ ...pl }))
      };
    }

    if (levelNum === 4 && !useCheckpoint) {
      window.isInMinerSupplyRoom = true;
      saved2_4MainState = {
        mapStrings: w2Data.mapStrings,
        enemySpawns: initialW2L4Spawns.enemySpawns.map(sp => ({ ...sp })),
        platformSpawns: initialW2L4Spawns.platformSpawns.map(pl => ({ ...pl }))
      };
      let roomData = buildWorld2MinerSupplyRoom();
      loadLevelMap(roomData.mapStrings);
      movingPlatforms = [];
      minerLampPickup = { x: 12.5 * TILE_SIZE + 20, y: 12 * TILE_SIZE + 12, taken: false };
    } else {
      window.isInMinerSupplyRoom = false;
      minerLampPickup = null;
      loadLevelMap(w2Data.mapStrings);
      movingPlatforms = (w2Data.platformSpawns || []).map(pl => ({ ...pl }));
    }

    if (levelNum === 5) {
      let arenaLeftX = (levelMap[0].length - 58) * TILE_SIZE;
      let arenaRightX = (levelMap[0].length - 10) * TILE_SIZE;
      sandwormBoss = {
        active: false,
        doorLocked: false,
        doorOpened: false,
        arenaLeft: arenaLeftX,
        arenaRight: arenaRightX,
        hp: 150,
        maxHp: 150,
        state: "IDLE",
        timer: 60,
        nextAttack: "",
        lastAttack: "",
        segments: [],
        headX: arenaRightX - 180,
        headY: 9 * TILE_SIZE,
        vx: 0,
        vy: 0,
        dir: -1,
        arcProgress: 0,
        beamAngle: 0,
        hurtFlash: 0
      };
      for (let i = 0; i < 16; i++) {
        sandwormBoss.segments.push({ x: sandwormBoss.headX, y: sandwormBoss.headY });
      }
    }

    enemies = [];
    if (!window.isInMinerSupplyRoom) {
      for (let sp of w2Data.enemySpawns) {
        let h = sp.type === "goomba" ? 30 : 38;
        enemies.push({
          type: sp.type,
          x: sp.col * TILE_SIZE + 20,
          y: sp.row * TILE_SIZE - h / 2 - 12,
          baseY: sp.row * TILE_SIZE - h / 2 - 24,
          w: 30, h: h, vx: -1.4, vy: 0,
          shellMoving: false, dead: false, flyPhase: random(TWO_PI),
          stunTimer: 0, knockbackX: 0
        });
      }
    }
  } 
  else {
    if (levelNum === 1) {
      is1_2Intro = false;
      loadLevelMap(MAP_1_1);
      spawnLevelEnemies(1);
    } else if (levelNum === 2) {
      is1_2Intro = true;
      loadLevelMap(MAP_1_2_INTRO);
    } else if (levelNum === 3) {
      is1_2Intro = false;
      loadLevelMap(MAP_1_3);
      spawnLevelEnemies(3);
      movingPlatforms = [
        { x: 102 * TILE_SIZE, y: 10 * TILE_SIZE, w: 3 * TILE_SIZE, h: 16, minX: 100 * TILE_SIZE, maxX: 112 * TILE_SIZE, speed: 2.2, dx: 0 },
        { x: 122 * TILE_SIZE, y: 8 * TILE_SIZE,  w: 3 * TILE_SIZE, h: 16, minX: 118 * TILE_SIZE, maxX: 132 * TILE_SIZE, speed: -2.5, dx: 0 }
      ];
    } else {
      is1_2Intro = false;
      loadLevelMap(MAP_1_4);
      spawnLevelEnemies(4);

      movingPlatforms = [
        { x: 122 * TILE_SIZE, y: 11 * TILE_SIZE, w: 3 * TILE_SIZE, h: 16, minX: 121 * TILE_SIZE, maxX: 135 * TILE_SIZE, speed: 2.4, dx: 0 }
      ];

      fireBars = [
        { cx: 43 * TILE_SIZE + 20, cy: 12 * TILE_SIZE + 20, angle: 0, speed: 0.032, count: 6, spacing: 20 },
        { cx: 72 * TILE_SIZE + 20, cy: 12 * TILE_SIZE + 20, angle: PI, speed: -0.035, count: 6, spacing: 20 },
        { cx: 105 * TILE_SIZE + 20, cy: 9 * TILE_SIZE + 20, angle: HALF_PI, speed: 0.038, count: 6, spacing: 20 }
      ];

      boss = {
        x: 185 * TILE_SIZE,
        y: 11 * TILE_SIZE - 42,
        w: 64,
        h: 84,
        vx: -1.6,
        vy: 0,
        minX: 173 * TILE_SIZE,
        maxX: 190 * TILE_SIZE,
        hp: 12,
        maxHp: 12,
        alive: true,
        falling: false,
        flashTimer: 0,
        lastFireTime: millis(),
        lastJumpTime: millis()
      };
    }
  }

  gameState = "LEVEL_INTRO";
  stateTimer = millis();

  isExitingPipe = false;
  isExitingCeilingPipe = false;
  characterX = 100;
  characterY = 100;
  if (currentWorld === 2 && levelNum === 4 && window.isInMinerSupplyRoom) {
    characterX = 2.5 * TILE_SIZE;
    characterY = 2.2 * TILE_SIZE; // 先藏在天花板水管內部
    isExitingCeilingPipe = true;
    playSFX("shrink");
  }
  if (typeof checkpointState !== "undefined" && checkpointState.active && checkpointState.world === currentWorld && checkpointState.level === levelNum) {
    characterX = checkpointState.x;
    characterY = checkpointState.y;
    let cpCol = floor(characterX / TILE_SIZE);
    for (let fr = 0; fr < levelMap.length; fr++) {
      if (levelMap[fr][cpCol] === 'R') levelMap[fr][cpCol] = 'r';
    }
  }
  velocityY = 0;

  if (resetRunStats) {
    score = 0;
    lives = 3;
    coinCount = 0;
    reservedItem = null;
  }
  if (!keepPowerup) {
    powerLevel = 1;
    powerType = "none";
  }

  if (keepPowerup) {
    levelEntrySnapshot = { lives, powerLevel, powerType, reservedItem, coinCount, score };
  }

  isCrouching = false;
  prevHitboxH = (powerLevel >= 2) ? BIG_HITBOX_H : BASE_HITBOX_H;
  hideCharacter = false;
  isGliding = false;
  isActionLocked = false;
  isShortJump = false;
  featherFlapsLeft = 2;
  isAttacking = false;
  items = [];
  coins = [];
  brickParticles = [];
  activeEffects = [];
  floatingTexts = [];
}
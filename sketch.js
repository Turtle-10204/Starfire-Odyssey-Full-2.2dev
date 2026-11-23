// =====================================================================
// sketch.js — p5 入口：setup() 與 draw() 主迴圈。
// =====================================================================

function getEffectiveViewZoom() {
  if (controlMode === "MOBILE" && autoFitMobileZoom) {
    return constrain(height / (15 * TILE_SIZE), 0.45, 1.35);
  }
  return viewZoom;
}

function setup() { 
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  imageMode(CENTER); 
  frameRate(60); 

  if (canvas && canvas.style) {
    canvas.style.touchAction = "none";
    canvas.style.userSelect = "none";
    canvas.style.webkitUserSelect = "none";
  }

  buildTexturePack();

  spriteMetrics["walk"]      = measureSpriteMetrics(walkSpriteSheet, WALK_FRAME_COUNT);
  spriteMetrics["stand"]     = measureSpriteMetrics(standSpriteSheet, STAND_FRAME_COUNT);
  spriteMetrics["jump"]      = measureSpriteMetrics(jumpSpriteSheet, JUMP_FRAME_COUNT);
  spriteMetrics["jumpMove"]  = measureSpriteMetrics(jumpMoveSpriteSheet, JUMP_MOVE_FRAME_COUNT);
  spriteMetrics["falling"]   = measureSpriteMetrics(fallingSpriteSheet, FALLING_FRAME_COUNT);
  spriteMetrics["attack"]    = measureSpriteMetrics(attackSpriteSheet, ATTACK_FRAME_COUNT);
  spriteMetrics["squat"]     = measureSpriteMetrics(squatSpriteSheet, SQUAT_FRAME_COUNT);
  spriteMetrics["squatMove"] = measureSpriteMetrics(squatMoveSpriteSheet, SQUAT_MOVE_FRAME_COUNT);

  // 防止 Ctrl+D / Ctrl+S 等組合鍵觸發 Chrome 預設書籤或存檔視窗
  window.addEventListener("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D' || e.key === 's' || e.key === 'S')) {
      e.preventDefault();
    }
  }, { passive: false });
} 

function draw() { 
  if (controlMode === "MOBILE") {
    updateMobileTouchState();
  }

  if (gameState === "DEVICE_SELECT") {
    drawDeviceSelect();
    return;
  }

  if (gameState === "WORLD_MAP") {
    drawWorldMap();
    if (showSettingsModal) drawSettingsModal();
    return;
  }

  if (gameState === "LEVEL_INTRO") {
    drawLevelIntro();
    return;
  }

  if (gameState === "GAME_OVER") {
    drawGameOver();
    return;
  }

  updateBGM();

  if (currentWorld === 2) {
    if (currentLevel === 4) {
      background(window.isInMinerSupplyRoom ? "#2B1E16" : "#05050C");
    } else if (currentLevel === 3 || currentLevel === 5) {
      background("#2B190E");
    } else {
      background("#F6BD60");
    }
  } else if (currentLevel === 1 || is1_2Intro) {
    background("#6b8cff"); 
  } else if (currentLevel === 2) {
    background("#0a0a12");
  } else if (currentLevel === 3) {
    background("#ff9a76");
  } else {
    background("#1a0505"); 
  }

  let z = getEffectiveViewZoom();
  let viewWorldW = width / z;
  let viewWorldH = height / z;

  // 關卡倒數計時器（開啟設定或道具圖鑑時暫停倒數）
  if (gameState === "PLAYING" && !showSettingsModal && !showExitMapConfirmModal) {
    if (millis() - lastLevelTimerTick >= 1000) {
      lastLevelTimerTick = millis();
      levelTimer--;
      if (levelTimer <= 0) {
        levelTimer = 0;
        handlePlayerDeath();
        return;
      }
    }
  }

  if (gameState !== "ITEM_GUIDE" && !showSettingsModal && !showExitMapConfirmModal) {
    if (invincibleTimer > 0) {
      invincibleTimer -= deltaTime;
      if (invincibleTimer < 0) invincibleTimer = 0;
    }
    if (starTimer > 0) {
      starTimer -= deltaTime;
      if (starTimer < 0) starTimer = 0;
    }
  }

  // --- 0.5 秒時間靜止變身／縮小演出 (TRANSFORM_FREEZE) ---
  if (gameState === "TRANSFORM_FREEZE") {
    transformTimer -= deltaTime;

    push();
    scale(z);
    let mapOffsetY = viewWorldH - (levelMap.length * TILE_SIZE);
    translate(-cameraX, mapOffsetY);

    drawWorld2AtmosphereAndLandmarks();
    drawMap(viewWorldW);
    drawMovingPlatforms();
    drawEnemies();
    if (currentLevel === 4) {
      drawFireBars();
      drawBossAndFireballs();
    }

    let showPhaseA = (floor(transformTimer / 100) % 2 === 0);
    let activeSpriteSheet = standSpriteSheet;
    let activeFrameCount = STAND_FRAME_COUNT;
    let metric = spriteMetrics["stand"] || spriteMetrics["walk"];
    let frameWidth = activeSpriteSheet.width / activeFrameCount;
    let frameHeight = activeSpriteSheet.height;

    let displayRealH = showPhaseA ? (transformFromBig ? 80 : 53) : (transformToBig ? 80 : 53);
    let displayScale = displayRealH / metric.contentHeight;
    let currentHitboxH = (powerLevel >= 2) ? BIG_HITBOX_H : BASE_HITBOX_H;
    let hitboxBottomY = characterY + currentHitboxH / 2;
    let frameBottomPad = metric.frameBottomPaddings[0] || 0;
    let drawCenterY = hitboxBottomY - (frameHeight * displayScale) / 2 + frameBottomPad * displayScale;

    push();
    translate(characterX, drawCenterY);
    scale(facingDirection * displayScale, displayScale);
    if (!showPhaseA && powerLevel === 3) {
      tint(getPowerTintColor(powerType));
    }
    image(activeSpriteSheet, 0, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
    noTint();
    pop();

    pop();

    drawNSMBHUD();
    if (controlMode === "MOBILE") drawMobileControls();

    if (transformTimer <= 0) {
      let oldHitboxH = transformFromBig ? BIG_HITBOX_H : BASE_HITBOX_H;
      let newHitboxH = (powerLevel >= 2) ? BIG_HITBOX_H : BASE_HITBOX_H;
      characterY += (oldHitboxH - newHitboxH) / 2;
      prevHitboxH = newHitboxH;
      if (transformIsDamage) {
        invincibleTimer = 1000;
      }
      gameState = "PLAYING";
    }
    return;
  }

  let isBig = (powerLevel >= 2);

  // 統一整合「鍵盤 + 手機虛擬按鍵（含手機 DASH 鎖定）」輸入
  let inputLeft  = keyIsDown(LEFT_ARROW)  || keyIsDown(65) || (controlMode === "MOBILE" && touchControls.left);
  let inputRight = keyIsDown(RIGHT_ARROW) || keyIsDown(68) || (controlMode === "MOBILE" && touchControls.right);
  let inputDown  = keyIsDown(DOWN_ARROW)  || keyIsDown(83) || (controlMode === "MOBILE" && touchControls.down);
  let inputDash  = (controlMode === "MOBILE" ? mobileDashLocked : dashToggleActive);

  // --- 蹲下狀態判斷 ---
  let standHitboxW = isBig ? BIG_HITBOX_W : BASE_HITBOX_W;
  let standHitboxH = isBig ? BIG_HITBOX_H : BASE_HITBOX_H;

  let currentFeetY = characterY + prevHitboxH / 2;
  let standCenterY = currentFeetY - standHitboxH / 2;
  let hasCeilingAbove = checkCollision(characterX, standCenterY, standHitboxW, standHitboxH);

  if (gameState === "PLAYING" && !showSettingsModal && !isAttacking) {
    if (isOnGround && inputDown) {
      isCrouching = true;
    } else if (isCrouching) {
      if (!hasCeilingAbove) {
        isCrouching = false;
      }
    }
  } else if (!hasCeilingAbove) {
    isCrouching = false;
  }

  let crouchHitboxFactor = isCrouching ? (isBig ? 0.5 : 0.75) : 1.0;
  let currentHitboxW = standHitboxW;
  let currentHitboxH = standHitboxH * crouchHitboxFactor;

  if (currentHitboxH !== prevHitboxH) {
    characterY += (prevHitboxH - currentHitboxH) / 2;
    prevHitboxH = currentHitboxH;
  }

  if (gameState !== "ITEM_GUIDE" && !showSettingsModal && !showExitMapConfirmModal) {
    updateMovingPlatforms();
    updateBumpingTiles();
    updateEnemies(currentHitboxW, currentHitboxH, viewWorldW);
    if (gameState === "TRANSFORM_FREEZE" || gameState === "GAME_OVER" || gameState === "LEVEL_INTRO" || gameState === "ITEM_GUIDE") return;
    updatePlayerFireballs();
    updateCactusNeedles();
    chronoFieldActive = (powerLevel === 3 && powerType === "chrono" && inputDash && gameState === "PLAYING");

    // <--- 新增：2-4 頭燈拾取與火把系統更新
    if (currentWorld === 2 && currentLevel === 4 && gameState === "PLAYING") {
      updateMinerLampAndTorches();
    }

    if (currentLevel === 4) {
      updateFireBars(currentHitboxW, currentHitboxH);
      if (gameState === "TRANSFORM_FREEZE" || gameState === "GAME_OVER" || gameState === "LEVEL_INTRO") return;
      updateBossAndFireballs(currentHitboxW, currentHitboxH, viewWorldW);
      if (gameState === "TRANSFORM_FREEZE" || gameState === "GAME_OVER" || gameState === "LEVEL_INTRO") return;
      updateBridgeCollapse();
    }
    if (currentWorld === 2 && currentLevel === 5) {
      updateSandwormBoss(currentHitboxW, currentHitboxH);
      updateRescueCutscene();
    }
  }

  // --- 1. 處理移動、加速菇漸進衝刺與過場 ---
  let moveX = 0; 
  let isMovingInput = (inputRight || inputLeft) && !isAttacking && !isCrouching;
  let wantsSprint = (powerType === "speed" && inputDash && isMovingInput);

  if (wantsSprint) {
    currentSprintBonus = min(1.0, currentSprintBonus + 0.022);
  } else {
    currentSprintBonus = max(0.0, currentSprintBonus - 0.04);
  }

  let speedMultiplier = 1.0 + currentSprintBonus * 0.85;
  if (starTimer > 0) speedMultiplier = max(speedMultiplier, 1.3);

  let effectiveMoveSpeed = isCrouching ? (MOVE_SPEED / 3) : (MOVE_SPEED * speedMultiplier);

  if (gameState === "PLAYING" && !showSettingsModal && !showExitMapConfirmModal) {
    // 自暈 3 秒時無法操作移動，只能等暈眩結束或受傷解除
    if (playerStunTimer > 0) {
      playerStunTimer -= deltaTime;
      if (playerStunTimer < 0) playerStunTimer = 0;
      currentSprintBonus = 0;
    } else if (!isAttacking) {
      if (inputRight) { moveX = effectiveMoveSpeed; facingDirection = 1; } 
      if (inputLeft)  { moveX = -effectiveMoveSpeed; facingDirection = -1; } 
    }

    if (abs(knockbackVX) > 0.1) {
      moveX = knockbackVX;
      knockbackVX *= 0.82;
    } else {
      knockbackVX = 0;
    }
    
    characterX += moveX + platformCarryDX; 
    characterX = constrain(characterX, currentHitboxW / 2, levelMap[0].length * TILE_SIZE - currentHitboxW / 2);

    if (flagCol !== -1) {
      let flagWallX = flagCol * TILE_SIZE + TILE_SIZE / 2;
      if (characterX + currentHitboxW / 2 > flagWallX) {
        characterX = flagWallX - currentHitboxW / 2;
      }
    }

    if (checkCollision(characterX, characterY, currentHitboxW, currentHitboxH)) {
      characterX -= (moveX + platformCarryDX); 
      currentSprintBonus = 0;
    }

    if (is1_2Intro && inputRight) {
      checkEnterPipe(characterX, characterY, currentHitboxW, currentHitboxH);
    }
    if (currentWorld === 2 && currentLevel === 4 && isOnGround && inputDown) {
    let footRow = floor((characterY + currentHitboxH / 2 + 4) / TILE_SIZE);
    let col = floor(characterX / TILE_SIZE);
    if (footRow >= 0 && footRow < levelMap.length && col >= 0 && col < levelMap[0].length) {
      let belowTile = levelMap[footRow][col];
      if (belowTile === 'p' && !window.isInMinerSupplyRoom) {
        gameState = "ENTERING_SUPPLY_PIPE";
        stateTimer = millis();
        playSFX("shrink");
      } else if (belowTile === 'u' && window.isInMinerSupplyRoom) {
        gameState = "EXITING_SUPPLY_PIPE";
        stateTimer = millis();
        playSFX("shrink");
      }
    }
  }

    if (currentLevel === 4) {
      checkAxeTrigger(characterX, characterY, currentHitboxW, currentHitboxH);
    }

  } else if (gameState === "BOSS_DEFEAT_CUTSCENE") {
    velocityY += gravity;
    characterY += velocityY;
    if (checkCollision(characterX, characterY, currentHitboxW, currentHitboxH)) {
      let bottomTileRow = floor((characterY + currentHitboxH / 2) / TILE_SIZE);
      characterY = bottomTileRow * TILE_SIZE - currentHitboxH / 2 - 0.1;
      velocityY = 0;
      isOnGround = true;
    }
    if (!bridgeCollapsing && boss && !boss.alive) {
      gameState = "WALK_TO_CASTLE";
      castleTargetX = 198 * TILE_SIZE;
    }

  } else if (gameState === "FLAG_SLIDE") {
    velocityY = 5;
    characterY += velocityY;

    // 自動找旗桿最頂端與底部位置，讓綠旗同步往下滑動
    let flagCol = floor(characterX / TILE_SIZE);
    let topFlagRow = 3;
    let bottomFlagRow = 11;
    for (let r = 0; r < levelMap.length; r++) {
      let t = levelMap[r][flagCol];
      if (t === 'F' || t === '|' || (currentWorld === 2 && t === 'H')) {
        topFlagRow = r;
        break;
      }
    }
    for (let r = topFlagRow; r < levelMap.length; r++) {
      let t = levelMap[r][flagCol];
      if (t === 'F' || t === '|' || (currentWorld === 2 && t === 'H')) {
        bottomFlagRow = r;
      }
    }
    let maxFlagDrop = max(0, (bottomFlagRow - topFlagRow) * TILE_SIZE);
    flagDropY = constrain(characterY - topFlagRow * TILE_SIZE, 0, maxFlagDrop);

    // 精準偵測旗桿下方地板高度，雙腳踩在草地表面不再陷進地板
    let groundTopY = (bottomFlagRow + 1) * TILE_SIZE - currentHitboxH / 2 - 0.1;
    if (checkCollision(characterX, characterY, currentHitboxW, currentHitboxH)) {
      let bottomTileRow = floor((characterY + currentHitboxH / 2) / TILE_SIZE);
      groundTopY = bottomTileRow * TILE_SIZE - currentHitboxH / 2 - 0.1;
    }

    if (characterY >= groundTopY) {
      characterY = groundTopY;
      velocityY = 0;
      isOnGround = true;
      flagDropY = maxFlagDrop;
      gameState = "WALK_TO_CASTLE";
    }

  } else if (gameState === "WALK_TO_CASTLE") {
    if (!hideCharacter) {
      moveX = 3;
      facingDirection = 1;
      characterX += moveX;
      if (characterX >= castleTargetX) {
      characterX = castleTargetX;
      hideCharacter = true; 
      stateTimer = millis();
      castleFlagRaised = true;
      castleFlagProgress = 0;
      let topCastleRow = 8;
      for (let r = 0; r < levelMap.length; r++) {
        if (levelMap[r].includes('C')) {
          topCastleRow = r;
          break;
        }
      }
      castleRoofTopY = topCastleRow * TILE_SIZE;
      // <--- 新增：2-4 過關抵達城堡時，頭燈與剩余火把化為白煙消散
      if (currentWorld === 2 && currentLevel === 4 && (hasMinerHeadlamp || torchCount > 0)) {
        for (let s = 0; s < 14; s++) {
          endClearBonusSmoke.push({
            x: characterX + random(-18, 18),
            y: characterY + random(-25, 10),
            vx: random(-1.5, 1.5),
            vy: random(-2.5, -0.8),
            r: random(10, 22),
            alpha: 240
          });
        }
        hasMinerHeadlamp = false;
        torchCount = 0;
        placedTorches = [];
        playSFX("powerup");
        floatingTexts.push({ text: "礦坑裝備已歸還！", x: characterX - 60, y: characterY - 55, vy: -1.2, life: 80 });
      }
    }
    } else {
      if (millis() - stateTimer > 1500) {
        let curId = `${currentWorld}-${currentLevel}`;
        let node = mapNodesData[curId];
        if (node) {
          node.cleared = true;
          // 判斷是否為秘密終點過關（後續關卡會設定 isSecretClear = true）
          let unlockList = (typeof isSecretClear !== "undefined" && isSecretClear && node.nextSecret)
            ? node.nextSecret
            : (node.nextNormal || []);

          for (let nextId of unlockList) {
            if (mapNodesData[nextId]) {
              mapNodesData[nextId].unlocked = true;
            }
          }
        }

        // 通過任意關卡後，沙漠補給屋重新開門營業！
        if (mapNodesData["2-SHOP"]) {
          mapNodesData["2-SHOP"].isOpen = true;
        }

        if (curId === "1-4") {
          // 回到 World 1 大地圖並播放 1-4 城堡白旗 → 聚光燈轉場動畫
          currentWorld = 1;
          selectedMapNode = "1-4";
          worldTransition = {
            active: true,
            phase: "WHITE_FLAG",
            timer: millis(),
            flagProgress: 0,
            roadProgress: 0,
            spotlightR: max(width, height)
          };
          gameState = "WORLD_MAP";
        } else if (curId === "2-5") {
          gameState = "ALL_CLEAR";
        } else {
          // 自動將游標移到剛解鎖的下一關
          let nextTargets = (typeof isSecretClear !== "undefined" && isSecretClear && node && node.nextSecret)
            ? node.nextSecret
            : (node && node.nextNormal ? node.nextNormal : []);
          if (nextTargets.length > 0 && mapNodesData[nextTargets[0]]) {
            selectedMapNode = nextTargets[0];
          }
          gameState = "WORLD_MAP";
        }
      }
    }

  } else if (gameState === "ENTERING_PIPE") {
  moveX = 2.0;
  facingDirection = 1;
  characterX += moveX;
  if (millis() - stateTimer > 650) {
    hideCharacter = true;
  }
  if (millis() - stateTimer > 1100) {
    // ...（原本切換到 MAP_1_2 的程式碼保持不變）
    is1_2Intro = false;
    loadLevelMap(MAP_1_2);
    spawnLevelEnemies(2);

    // 在 1-2 地下場景左側地面上放一根「地下入口水管」，讓主角從管口鑽出來
    let pipeCol = 2;
    let groundRow = 13;
    for (let r = levelMap.length - 1; r >= 0; r--) {
      if (levelMap[r][pipeCol] === 'G' || levelMap[r][pipeCol] === 'B') {
        groundRow = r;
        break;
      }
    }
    if (groundRow >= 3) {
      levelMap[groundRow - 1][pipeCol] = 'P';
      levelMap[groundRow - 2][pipeCol] = 'P';
    }

    cameraX = 0;
    characterX = pipeCol * TILE_SIZE + TILE_SIZE / 2;
    characterY = (groundRow - 1) * TILE_SIZE + 12;
    velocityY = 0;
    hideCharacter = false;
    castleFlagRaised = false;
    castleFlagProgress = 0;
    stateTimer = millis();
    isExitingPipe = true;
    gameState = "PLAYING";
  }
} else if (gameState === "ENTERING_SUPPLY_PIPE") {
    moveX = 0;
    characterY += 1.8;
    if (millis() - stateTimer > 550) {
      let spawnCopy = initialW2L4Spawns;
      if (!spawnCopy) {
        let fallbackData = buildWorld2Level(4);
        spawnCopy = {
          enemySpawns: (fallbackData.enemySpawns || []).map(sp => ({ ...sp })),
          platformSpawns: (fallbackData.platformSpawns || []).map(pl => ({ ...pl }))
        };
        initialW2L4Spawns = spawnCopy;
      }
      saved2_4MainState = {
        mapStrings: levelMap.map(r => r.join('')),
        enemySpawns: spawnCopy.enemySpawns.map(sp => ({ ...sp })),
        platformSpawns: spawnCopy.platformSpawns.map(pl => ({ ...pl }))
      };
      window.isInMinerSupplyRoom = true;
      let roomData = buildWorld2MinerSupplyRoom();
      loadLevelMap(roomData.mapStrings);
      movingPlatforms = [];
      enemies = [];
      if (!hasMinerHeadlamp) {
        minerLampPickup = { x: 12.5 * TILE_SIZE + 20, y: 12 * TILE_SIZE + 12, taken: false };
      }
      characterX = 2.5 * TILE_SIZE;
      characterY = 2.2 * TILE_SIZE;
      velocityY = 0;
      cameraX = 0;
      isExitingCeilingPipe = true;
      playSFX("shrink");
      gameState = "PLAYING";
      floatingTexts.push({ text: "礦工裝備補給站（全亮區域）", x: characterX, y: 4.5 * TILE_SIZE, vy: -1, life: 95, isOneUp: true });
    }
  } else if (gameState === "EXITING_SUPPLY_PIPE") {
    moveX = 0;
    characterY += 1.8;
    if (millis() - stateTimer > 550) {
      window.isInMinerSupplyRoom = false;
      let usedFallback = false;
      let targetState = saved2_4MainState;
      if (!targetState || !Array.isArray(targetState.mapStrings) || targetState.mapStrings.length === 0) {
        usedFallback = true;
        let fallbackData = buildWorld2Level(4);
        targetState = {
          mapStrings: fallbackData.mapStrings,
          enemySpawns: initialW2L4Spawns ? initialW2L4Spawns.enemySpawns : (fallbackData.enemySpawns || []),
          platformSpawns: initialW2L4Spawns ? initialW2L4Spawns.platformSpawns : (fallbackData.platformSpawns || [])
        };
      }
      loadLevelMap(targetState.mapStrings);
      movingPlatforms = (targetState.platformSpawns || []).map(pl => ({ ...pl }));
      enemies = [];
      for (let sp of (targetState.enemySpawns || [])) {
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
      characterX = 3 * TILE_SIZE;
      characterY = 12 * TILE_SIZE - currentHitboxH / 2 - 2;
      velocityY = 0;
      cameraX = 0;
      gameState = "PLAYING";
      if (usedFallback) {
        floatingTexts.push({ text: "地圖資料異常，已返回入口", x: characterX - 40, y: characterY - 35, vy: -1, life: 95, isOneUp: true });
      } else {
        floatingTexts.push({ text: "進入幽暗古礦坑！按 [E] 插火把", x: characterX - 40, y: characterY - 35, vy: -1, life: 95, isOneUp: true });
      }
    }
  } else if (gameState === "ENTERING_QUICKSAND") {
    let elapsed = millis() - stateTimer;
    moveX = 0;
    velocityY = 0;
    characterY += 1.2;

    if (elapsed > 550) {
      is2_1SubSecret = true;
      let subData = buildWorld2SubSecretMap();
      loadLevelMap(subData.mapStrings);
      enemies = [];
      for (let sp of subData.enemySpawns) {
        let h = sp.type === "goomba" ? 30 : 38;
        enemies.push({
          type: sp.type, x: sp.col * TILE_SIZE + 20, y: sp.row * TILE_SIZE - h / 2 - 12,
          baseY: sp.row * TILE_SIZE - h / 2 - 24, w: 30, h: h, vx: -1.4, vy: 0,
          shellMoving: false, dead: false, flyPhase: random(TWO_PI), stunTimer: 0, knockbackX: 0
        });
      }
      characterX = 3 * TILE_SIZE;
      characterY = 4 * TILE_SIZE;
      velocityY = 0;
      cameraX = 0;
      quicksandFadeInTimer = millis();
      gameState = "PLAYING";
      floatingTexts.push({ text: "被流沙吸入地下秘室！尋找紅色終點旗！", x: characterX, y: characterY - 30, vy: -1, life: 110, isOneUp: true });
    }
  }
if (isExitingPipe) {
  moveX = 0;
  velocityY = 0;
  characterY -= 1.5;
  let pipeCol = floor(characterX / TILE_SIZE);
  let pipeTopRow = 11;
  for (let r = 0; r < levelMap.length; r++) {
    if (levelMap[r][pipeCol] === 'P') {
      pipeTopRow = r;
      break;
    }
  }
  let targetStandY = pipeTopRow * TILE_SIZE - currentHitboxH / 2 - 0.5;
  if (characterY <= targetStandY) {
    characterY = targetStandY;
    isExitingPipe = false;
  }
}
// --- 2. 物理系統與碰撞偵測 ---
  if (isExitingPipe) {
    moveX = 0;
    velocityY = 0;
    characterY -= 1.2; // 慢慢從水管裡往上升上來
    let pipeCol = floor(characterX / TILE_SIZE);
    let pipeTopRow = 11;
    for (let r = 0; r < levelMap.length; r++) {
      if (levelMap[r][pipeCol] === 'P') {
        pipeTopRow = r;
        break;
      }
    }
    let targetStandY = pipeTopRow * TILE_SIZE - currentHitboxH / 2 - 0.5;
    if (characterY <= targetStandY) {
      characterY = targetStandY;
      isExitingPipe = false;
    }
  }

  if (isExitingCeilingPipe) {
    moveX = 0;
    velocityY = 0;
    characterY += 1.4; // 慢慢從天花板水管往下鑽出

    // 自動偵測天花板水管最底端管口的 Y 座標
    let pipeCol = floor(characterX / TILE_SIZE);
    let mouthBottomY = 4 * TILE_SIZE;
    for (let r = 2; r < levelMap.length; r++) {
      let t = levelMap[r][pipeCol];
      if (t === 'P' || t === 'p' || t === 'u') {
        mouthBottomY = (r + 1) * TILE_SIZE;
      } else {
        break;
      }
    }

    // 等到主角頭頂完全離開管口下方，就解除動畫並自然落下
    let headTopY = characterY - currentHitboxH / 2;
    if (headTopY >= mouthBottomY + 2) {
      isExitingCeilingPipe = false;
      velocityY = 1.5;
    }
  }

  platformCarryDX = 0;

  if (!isExitingPipe && !isExitingCeilingPipe && ((gameState === "PLAYING" && !showSettingsModal) || gameState === "WALK_TO_CASTLE")) {
    if (isGliding && velocityY > 0) {
      velocityY += gravity * 0.2; 
      if (velocityY > 2) velocityY = 2; 
    } else {
      velocityY += gravity;    
    }
    
    let prevFeetY = characterY + currentHitboxH / 2;
    characterY += velocityY; 
    isOnGround = false; 
    
    if (velocityY < 0) {
      let headY = characterY - currentHitboxH / 2;
      let hitHiddenLeft  = checkHiddenBlockHit(characterX - currentHitboxW * 0.25, headY);
      let hitHiddenRight = checkHiddenBlockHit(characterX + currentHitboxW * 0.25, headY);
      if (hitHiddenLeft || hitHiddenRight) {
        let topTileRow = floor(headY / TILE_SIZE);
        characterY = (topTileRow + 1) * TILE_SIZE + currentHitboxH / 2 + 0.1;
        velocityY = 0;
      }
    }

   if (checkCollision(characterX, characterY, currentHitboxW, currentHitboxH)) {
      if (velocityY > 0) { 
        let bottomTileRow = floor((characterY + currentHitboxH / 2) / TILE_SIZE);
        characterY = bottomTileRow * TILE_SIZE - currentHitboxH / 2 - 0.1; 
        velocityY = 0; 
        isOnGround = true; 
        isGliding = false; 
        isActionLocked = false; 
        isShortJump = false; 
        featherFlapsLeft = 2;

        // <--- 新增這 4 行：每 10 幀紀錄一次地面安全座標供時光回溯使用
        if (gameState === "PLAYING" && frameCount % 10 === 0) {
          safePositionHistory.push({ x: characterX, y: characterY });
          if (safePositionHistory.length > 12) safePositionHistory.shift();
        }
      } else if (velocityY < 0) { 
        let topTileRow = floor((characterY - currentHitboxH / 2) / TILE_SIZE);
        characterY = (topTileRow + 1) * TILE_SIZE + currentHitboxH / 2 + 0.1; 
        velocityY = 0; 
        
        checkHitTile(characterX - currentHitboxW * 0.48, characterY - currentHitboxH / 2 - 4);
        checkHitTile(characterX, characterY - currentHitboxH / 2 - 4);
        checkHitTile(characterX + currentHitboxW * 0.48, characterY - currentHitboxH / 2 - 4);
      }
    }

    if (velocityY >= 0 && !isOnGround) {
      let newFeetY = characterY + currentHitboxH / 2;
      for (let mp of movingPlatforms) {
        if (characterX + currentHitboxW / 2 > mp.x && characterX - currentHitboxW / 2 < mp.x + mp.w) {
          if (prevFeetY <= mp.y + 8 && newFeetY >= mp.y) {
            characterY = mp.y - currentHitboxH / 2 - 0.1;
            velocityY = 0;
            isOnGround = true;
            isGliding = false;
            isActionLocked = false;
            isShortJump = false;
            featherFlapsLeft = 2;
            platformCarryDX = mp.dx;
            break;
          }
        }
      }
    }
    // World 2 流沙 ('Q') 與仙人掌刺柱 ('K') 互動
    if (currentWorld === 2 && gameState === "PLAYING") {
      let pCol = floor(characterX / TILE_SIZE);
      let footRow = floor((characterY + currentHitboxH / 2 - 4) / TILE_SIZE);
      let bodyRow = floor(characterY / TILE_SIZE);

      if (footRow >= 0 && footRow < levelMap.length && pCol >= 0 && pCol < levelMap[0].length) {
       if (levelMap[footRow][pCol] === 'V' && !is2_1SubSecret) {
  // 跟一般流沙一樣慢慢往下沉（按跳還可以逃出來）
  if (velocityY > 0.5) velocityY = 0.5;
  isOnGround = true;
  isActionLocked = false;

  // 只有整個人沉到流沙格子最底部（第 14 排底部）時，啟動平滑轉場進入地下密室
  let bottomOfSandY = (footRow + 1) * TILE_SIZE;
  if (characterY + currentHitboxH / 2 >= bottomOfSandY - 2 && gameState === "PLAYING") {
    gameState = "ENTERING_QUICKSAND";
    stateTimer = millis();
    quicksandExitMode = false;
    playSFX("shrink");
  }
}
        if (levelMap[footRow][pCol] === 'Q') {
          if (powerLevel === 3 && powerType === "chrono") {
            if (velocityY > 0) {
              velocityY = 0;
              characterY = footRow * TILE_SIZE - currentHitboxH / 2;
              isOnGround = true;
            }
          } else {
            // 減慢下沉速度，給玩家充足反應時間
            if (velocityY > 0.42) velocityY = 0.42;
            isOnGround = true;
            isActionLocked = false;

            // 偵測玩家按跳躍鍵：每按一次就把雙腳往上拔一截並給予脫困向上衝量
            if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(32)) {
              characterY -= 12;
              velocityY = -10.5;
              isOnGround = false;
              playSFX("jump");
            } else if (frameCount % 22 === 0) {
              floatingTexts.push({ text: "流沙！連跳脫困", x: characterX - 35, y: characterY - 35, vy: -0.8, life: 25 });
            }
          }
        }
      }

      if (bodyRow >= 0 && bodyRow < levelMap.length && pCol >= 0 && pCol < levelMap[0].length) {
        if (levelMap[bodyRow][pCol] === 'K') {
          if (starTimer > 0 || (powerLevel === 3 && powerType === "cactus" && isCrouching)) {
            levelMap[bodyRow][pCol] = ' ';
            spawnBrickParticles(pCol * TILE_SIZE + 20, bodyRow * TILE_SIZE + 20);
            playSFX("brick");
            score += 200;
          } else {
            takeDamage();
            return;
          }
        }
      }
    }
    if (gameState === "PLAYING" && checkLavaHazard(characterX, characterY, currentHitboxW, currentHitboxH)) {
      handlePlayerDeath();
      return;
    }
  }

  if (gameState === "PLAYING") {
    checkFlagpole(characterX, characterY, currentHitboxW, currentHitboxH);
  }

  if (characterY > levelMap.length * TILE_SIZE + 200) {
    handlePlayerDeath();
    return;
  }
  // --- 3. 判斷動畫狀態 ---
  const isJumping = !isOnGround; 
  
  if (gameState === "FLAG_SLIDE") {
    animationState = "falling";
  } else if (gameState === "WALK_TO_CASTLE" || gameState === "ENTERING_PIPE") {
    animationState = "walk";
  } else if (isAttacking) {
    animationState = "attack"; 
  } else if (isActionLocked) {
    animationState = "jump";
  } else {
    if (isGliding) {
      animationState = "falling";
    } else if (isJumping) {
      if (previousAnimation === "jump") {
        animationState = "falling";
      } else if (moveX !== 0) {
        animationState = "jumpMove"; 
      } else {
        if (velocityY > 0) {
          animationState = "falling";
        } else {
          animationState = "jump";
          isActionLocked = true; 
        }
      }
    } else if (isCrouching) {
      if (moveX !== 0) {
        animationState = "squatMove";
      } else {
        animationState = "squat";
      }
    } else {
      if (moveX !== 0) {
        animationState = "walk";
      } else {
        animationState = "stand";
      }
    }
  }

  let activeSpriteSheet;
  let activeFrameCount;

  if (animationState === "attack") { activeSpriteSheet = attackSpriteSheet; activeFrameCount = ATTACK_FRAME_COUNT; }
  else if (animationState === "squatMove") { activeSpriteSheet = squatMoveSpriteSheet; activeFrameCount = SQUAT_MOVE_FRAME_COUNT; }
  else if (animationState === "squat") { activeSpriteSheet = squatSpriteSheet; activeFrameCount = SQUAT_FRAME_COUNT; }
  else if (animationState === "falling") { activeSpriteSheet = fallingSpriteSheet; activeFrameCount = FALLING_FRAME_COUNT; } 
  else if (animationState === "jumpMove") { activeSpriteSheet = jumpMoveSpriteSheet; activeFrameCount = JUMP_MOVE_FRAME_COUNT; } 
  else if (animationState === "jump") { activeSpriteSheet = jumpSpriteSheet; activeFrameCount = JUMP_FRAME_COUNT; } 
  else if (animationState === "walk") { activeSpriteSheet = walkSpriteSheet; activeFrameCount = WALK_FRAME_COUNT; } 
  else { activeSpriteSheet = standSpriteSheet; activeFrameCount = STAND_FRAME_COUNT; }
  
  const frameWidth = activeSpriteSheet.width / activeFrameCount; 
  const frameHeight = activeSpriteSheet.height; 

  const WALK_REAL_HEIGHT = isBig ? 80 : 53;
  let metric = spriteMetrics[animationState] || spriteMetrics["walk"];

  let targetContentHeight = WALK_REAL_HEIGHT;
  if (animationState === "squat" || animationState === "squatMove") {
    targetContentHeight = WALK_REAL_HEIGHT * 0.78 * 1.15;
  }

  let displayScale = targetContentHeight / metric.contentHeight;

  // --- 4. 動態播放速率控制 ---
  if (animationState !== previousAnimation) { 
    currentFrame = 0; 
    lastFrameTime = millis(); 
    previousAnimation = animationState; 
  } 

  let currentFrameInterval = BASE_FRAME_INTERVAL;
  if (animationState === "walk") {
    currentFrameInterval = BASE_FRAME_INTERVAL / (1.0 + currentSprintBonus * 1.35);
  } else if (animationState === "jumpMove") {
    currentFrameInterval = isShortJump ? 25 : 60; 
  } else if (animationState === "squat") {
    currentFrameInterval = 60; 
  }

  if (gameState !== "ITEM_GUIDE" && !showSettingsModal  && millis() - lastFrameTime >= currentFrameInterval) { 
    currentFrame++;
    lastFrameTime = millis(); 
    
    if (animationState === "attack") {
      if (currentFrame >= activeFrameCount) {
        isAttacking = false; 
        currentFrame = activeFrameCount - 1; 
      }
    } else if (animationState === "squat") {
      currentFrame = min(currentFrame, activeFrameCount - 1);
    } else if (animationState === "jump" && currentFrame >= JUMP_FRAME_COUNT) {
      isActionLocked = false;
      animationState = "falling";
      previousAnimation = "jump"; 
      currentFrame = 0;
    } else {
      currentFrame = currentFrame % activeFrameCount;
    }
  }
  currentFrame = min(currentFrame, activeFrameCount - 1);

  // --- 射擊與火焰花攻擊邏輯 ---
  if (isAttacking && (currentFrame === 6 || currentFrame === 7) && !hasFiredThisAttack) {
    let muzzleOffsetX = (WALK_REAL_HEIGHT * 0.75) * facingDirection; 
    let muzzleOffsetY = isBig ? -15 : -10; 
    
    let startX = characterX + muzzleOffsetX;
    let startY = characterY + muzzleOffsetY;

    if (powerType === "fire") {
      playSFX("fireball");
      playerFireballs.push({
        x: startX,
        y: startY,
        vx: 11.5 * facingDirection,
        vy: -1.2,
        life: 110
      });
    } else if (powerType === "cactus") {
      playSFX("shoot");
      cactusNeedles.push({
        x: startX,
        y: startY,
        vx: 15 * facingDirection,
        life: 70
      });
    } else {
      playSFX("shoot");
    }

    let hitX = startX;
    let hitY = startY;
    let maxDistance = viewWorldW; 
    let step = 10;           
    let currentDistance = 0;

    while (currentDistance < maxDistance) {
      hitX += step * facingDirection;
      currentDistance += step;

      let hitEnemy = false;
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        let en = enemies[ei];
        if (!en.dead && abs(hitX - en.x) < en.w / 2 + 8 && abs(hitY - en.y) < en.h / 2 + 8) {
          en.dead = true;
          en.vy = -6;
          score += 200;
          playSFX("kick");
          floatingTexts.push({ text: "+200", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
          hitEnemy = true;
          break;
        }
      }
      if (hitEnemy) break;

      if (currentLevel === 4 && boss && boss.alive && !boss.falling) {
        if (abs(hitX - boss.x) < boss.w / 2 && abs(hitY - boss.y) < boss.h / 2) {
          let dmg = (powerType === "fire") ? 3 : 1;
          boss.hp -= dmg;
          boss.flashTimer = 6;
          score += 200 * dmg;
          if (boss.hp <= 0) {
            boss.falling = true;
            boss.vy = -6;
            score += 15000;
            playSFX("clear");
            floatingTexts.push({ text: "+15000 BOSS DEFEATED!", x: boss.x - 60, y: boss.y - 60, vy: -1.5, life: 120 });
            gameState = "BOSS_DEFEAT_CUTSCENE";
          }
          break;
        }
      }
      
      let c = floor(hitX / TILE_SIZE);
      let r = floor(hitY / TILE_SIZE);
      
      if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
        let tile = levelMap[r][c];
        if (tile !== ' ' && tile !== 'I' && tile !== 'A' && tile !== 'L' && tile !== '|' && tile !== 'F' && tile !== 'C') { 
          if (tile === 'B') {
            levelMap[r][c] = ' ';
            score += 50;
            playSFX("brick");
            spawnBrickParticles(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
          } else if (tile === '?') {
            levelMap[r][c] = 'E';
            addCoinAndScore(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE);
          } else if (tile === 'M' || tile === '*') {
            levelMap[r][c] = 'E';
            spawnPowerupFromBlock(tile, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE - TILE_SIZE / 2);
          }
          else if (tile === 't') {
          levelMap[r][c] = 'E';
          addBumpTile(r, c);
          torchCount += 16;
          playSFX("powerup");
          floatingTexts.push({ text: "獲得 16 根火把！", x: c * TILE_SIZE - 30, y: r * TILE_SIZE - 20, vy: -1.5, life: 70, isOneUp: true });
        }
          break; 
        }
      }
    }

    let effectScale = isBig ? 0.24 : 0.166;

    activeEffects.push({
      img: muzzleFlashImg,
      x: startX,
      y: startY,
      spawnTime: millis(),
      duration: 50,      
      scale: effectScale,      
      direction: facingDirection
    });

    activeEffects.push({
      img: hitEffectImg,
      x: hitX,
      y: hitY,
      spawnTime: millis(),
      duration: 50,      
      scale: effectScale,      
      direction: facingDirection
    });

    hasFiredThisAttack = true; 
  }

  // --- 5. 攝影機跟隨（依視角縮放自動計算視野寬度） ---
  let maxCameraX = max(0, levelMap[0].length * TILE_SIZE - viewWorldW);
  cameraX = constrain(characterX - viewWorldW / 3, 0, maxCameraX);

  // --- 6. 繪製世界（套用視角縮放） ---
  push(); 
  scale(z);
  let mapOffsetY = viewWorldH - (levelMap.length * TILE_SIZE);
  translate(-cameraX, mapOffsetY); 

  if (castleFlagRaised) {
  castleFlagProgress = min(1, castleFlagProgress + 0.035);
  let poleHeight = 52 * castleFlagProgress;
  let poleBaseY = castleRoofTopY + 14;
  let poleTopY = poleBaseY - poleHeight;

  push();
  // 旗桿
  stroke("#FFFFFF");
  strokeWeight(4);
  line(castleTargetX, poleBaseY, castleTargetX, poleTopY);

  // 旗桿頂端金球
  noStroke();
  fill("#FFD166");
  ellipse(castleTargetX, poleTopY, 10, 10);

  // 升起超過一半時展開紅色金星小旗子
  if (castleFlagProgress > 0.35) {
    let wave = sin(frameCount * 0.2) * 2.5;
    fill("#E63946");
    stroke("#540B0E");
    strokeWeight(1.5);
    beginShape();
    vertex(castleTargetX, poleTopY + 3);
    vertex(castleTargetX + 34, poleTopY + 12 + wave);
    vertex(castleTargetX, poleTopY + 23);
    endShape(CLOSE);

    // 旗面中央小星星徽章
    noStroke();
    fill("#FFD166");
    ellipse(castleTargetX + 12, poleTopY + 13 + wave * 0.4, 7, 7);
  }
  pop();
}
  drawWorld2AtmosphereAndLandmarks(); // <--- 新增這 1 行（畫在所有磚塊與角色後方）
  drawMap(viewWorldW);
  drawMovingPlatforms();
  drawEnemies();
  if (currentLevel === 4) {
    drawFireBars();
    drawBossAndFireballs();
  }
  if (currentWorld === 2 && currentLevel === 5) {
    drawSandwormBoss();
    drawRescueCutscene();
  }
  if (gameState !== "ITEM_GUIDE" && !showSettingsModal && !showExitMapConfirmModal) {
    updateAndDrawItems(currentHitboxW, currentHitboxH);
  }
  drawPlayerFireballs();
  drawCactusNeedles();

  if (gameState === "PLAYING" && !showSettingsModal && !showExitMapConfirmModal) {
    checkCollectOpenCoins(currentHitboxW, currentHitboxH);
  }
  updateAndDrawCoins(); 
  updateAndDrawBrickParticles();

  let isInvincibleHidden = (invincibleTimer > 0 && floor(invincibleTimer / 100) % 2 === 1);
  if (!hideCharacter && !isInvincibleHidden) {
    let hitboxBottomY = characterY + currentHitboxH / 2;
    let frameBottomPad = metric.frameBottomPaddings[currentFrame] || 0;
    let realFeetOffsetFromCanvasBottom = frameBottomPad * displayScale;
    let drawCenterY = hitboxBottomY - (frameHeight * displayScale) / 2 + realFeetOffsetFromCanvasBottom;

    if (currentSprintBonus > 0.45 && moveX !== 0) {
      push();
      translate(characterX - facingDirection * 14, drawCenterY);
      scale(facingDirection * displayScale, displayScale);
      tint(100, 220, 255, 110);
      image(activeSpriteSheet, 0, 0, frameWidth, frameHeight, currentFrame * frameWidth, 0, frameWidth, frameHeight);
      noTint();
      pop();
    }
    // 當主角正在進出水管過場時，補畫一次地圖圖層在主角前方，讓綠色水管自然遮住主角身體
  if (gameState === "PIPE_ENTER" || gameState === "PIPE_EXIT") {
    drawMap(viewWorldW);
  }
    if (powerLevel === 3 && powerType === "cactus" && isCrouching) {
      push();
      translate(characterX, characterY);
      noFill();
      stroke("#38B000");
      strokeWeight(3);
      ellipse(0, 0, currentHitboxW + 22, currentHitboxH + 14);
      pop();
    }
    if (chronoWaveTimer > 0) {
      chronoWaveTimer -= deltaTime;
      let progress = 1 - max(0, chronoWaveTimer) / 450;
      push();
      translate(characterX, characterY);
      noFill();
      stroke(255, 209, 102, 220 * (1 - progress));
      strokeWeight(5 * (1 - progress) + 1);
      ellipse(0, 0, progress * 520, progress * 520);
      pop();
    }
    if (chronoFieldActive) {
      push();
      translate(characterX, characterY);
      fill(255, 209, 102, 35);
      stroke("#FFD166");
      strokeWeight(2);
      ellipse(0, 0, 520, 520);
      pop();
    }
    if (powerType === "feather") {
      push();
      translate(characterX - facingDirection * 12, drawCenterY - 4);
      fill("#FFF3B0");
      stroke("#E09F3E");
      strokeWeight(2);
      let wingFlap = sin(frameCount * 0.25) * 6;
      ellipse(0, wingFlap, 18, 28);
      pop();
    }

    if (activeCharacterId === 1) {
      // 繪製解鎖的新角色「沙漠遊俠」造型
      push();
      translate(characterX, hitboxBottomY);
      scale(facingDirection * (isBig ? 1.35 : 1.0), (isBig ? 1.35 : 1.0) * (isCrouching ? 0.65 : 1.0));
      noStroke();
      fill(starTimer > 0 ? color((frameCount * 20) % 255, 200, 255) : "#2EC4B6");
      rect(-12, -34, 24, 34, 6);
      fill("#FFD166");
      ellipse(0, -44, 24, 24);
      fill("#E63946");
      rect(-15, -52, 30, 7, 3);
      fill(0);
      ellipse(5, -45, 4, 5);
      pop();
    } else {
      push(); 
      translate(characterX, drawCenterY); 
      scale(facingDirection * displayScale, displayScale); 
      if (starTimer > 0) {
        colorMode(HSB, 360, 100, 100);
        tint((frameCount * 18) % 360, 85, 100);
      } else if (powerLevel === 3) {
        tint(getPowerTintColor(powerType));
      }
      image(activeSpriteSheet, 0, 0, frameWidth, frameHeight, currentFrame * frameWidth, 0, frameWidth, frameHeight); 
      noTint();
      colorMode(RGB, 255); // <--- 補上這行，還原預設 RGB 模式！
      pop(); 
    }

    // 主角自暈 3 秒期間：頭頂畫出 3 顆旋轉金星
    if (playerStunTimer > 0) {
      push();
      translate(characterX, characterY - currentHitboxH / 2 - 14);
      for (let s = 0; s < 3; s++) {
        let ang = frameCount * 0.18 + s * (TWO_PI / 3);
        noStroke();
        fill("#FFD700");
        ellipse(cos(ang) * 16, sin(ang) * 5, 7, 7);
      }
      pop();
    }
  }

  if (gameState === "ENTERING_PIPE" || isExitingPipe || isExitingCeilingPipe || gameState === "ENTERING_SUPPLY_PIPE" || gameState === "EXITING_SUPPLY_PIPE") {
    drawPipesOnly();
}

  for (let i = activeEffects.length - 1; i >= 0; i--) {
    let ef = activeEffects[i];
    if (millis() - ef.spawnTime > ef.duration) {
      activeEffects.splice(i, 1); 
    } else {
      push();
      translate(ef.x, ef.y);
      scale(ef.direction * ef.scale, ef.scale); 
      image(ef.img, 0, 0); 
      pop();
    }
  }

  updateAndDrawFloatingTexts();

  // <--- 新增：2-4 黑暗礦坑頭燈裝備架、火把與黑暗視野遮罩
  if (currentWorld === 2 && currentLevel === 4) {
    drawMinerLampAndTorches(viewWorldW, viewWorldH);
  }
  // 進出水管與流沙黑幕平滑轉場，消除畫面硬切割裂感
let pipeFadeAlpha = 0;
if (gameState === "ENTERING_PIPE") {
  let elapsed = millis() - stateTimer;
  if (elapsed > 650) {
    pipeFadeAlpha = map(elapsed, 650, 1100, 0, 255, true);
  }
} else if (gameState === "ENTERING_SUPPLY_PIPE" || gameState === "EXITING_SUPPLY_PIPE") {
  let elapsed = millis() - stateTimer;
  if (elapsed > 250) {
    pipeFadeAlpha = map(elapsed, 250, 550, 0, 255, true);
  }
} else if (gameState === "ENTERING_QUICKSAND") {
  let elapsed = millis() - stateTimer;
  if (elapsed > 150) {
    pipeFadeAlpha = map(elapsed, 150, 550, 0, 255, true);
  }
} else if (isExitingPipe) {
  let elapsed = millis() - stateTimer;
  if (elapsed < 350) {
    pipeFadeAlpha = map(elapsed, 0, 350, 255, 0, true);
  }
} else if (typeof quicksandFadeInTimer !== "undefined" && millis() - quicksandFadeInTimer < 400) {
  pipeFadeAlpha = map(millis() - quicksandFadeInTimer, 0, 400, 255, 0, true);
}

if (pipeFadeAlpha > 0) {
  push();
  resetMatrix();
  noStroke();
  fill(0, 0, 0, pipeFadeAlpha);
  rect(0, 0, width, height);
  pop();
}

  pop(); 

  drawNSMBHUD();

  if (controlMode === "MOBILE" && gameState === "PLAYING" && !showSettingsModal) {
    drawMobileControls();
  }

  if (gameState === "ITEM_GUIDE" && activeGuideData) {
    drawItemGuideModal();
  }

  if (showSettingsModal) {
    drawSettingsModal();
  }

  if (showExitMapConfirmModal) {
    drawExitMapConfirmModal();
  }

  if (gameState === "ALL_CLEAR") {
    fill(0, 0, 0, 190);
    rect(0, 0, width, height);
    fill("#FFD700");
    textSize(min(52, width * 0.06));
    textAlign(CENTER, CENTER);
    text("ALL COURSES CLEAR!", width / 2, height / 2 - 60);
    fill("#FF6B6B");
    textSize(min(24, width * 0.032));
    text(
      unlockedNewChar
        ? `你擊敗了沙暴巨蟲並救出了沙漠遊俠！（目前：${activeCharacterId === 1 ? "沙漠遊俠" : "原本主角"}）`
        : "你成功擊敗了魔王，拯救了這片大地！",
      width / 2,
      height / 2 - 5
    );
    fill(255);
    textSize(min(24, width * 0.032));
    text(`FINAL SCORE: ${score}`, width / 2, height / 2 + 42);
    textSize(17);
    fill("#FFD166");
    text(
      unlockedNewChar
        ? (controlMode === "MOBILE" ? "點擊螢幕返回大地圖" : "按 [C] 切換角色  ｜  按 [M] 返回大地圖選關畫面")
        : (controlMode === "MOBILE" ? "點擊螢幕返回大地圖" : "按 [M] 返回大地圖選關畫面"),
      width / 2,
      height / 2 + 88
    );
  }
}

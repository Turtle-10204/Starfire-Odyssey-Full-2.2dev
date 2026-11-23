// =====================================================================
// input.js — 輸入：手機虛擬按鍵、點擊分派、鍵盤事件、跳躍/射擊/空投動作。
// =====================================================================

let mobileDashLocked = false;

let dashToggleActive = false;

// 手機觸控虛擬按鍵狀態
let touchControls = {
  left: false,
  right: false,
  down: false,
  jump: false,
  fire: false
};

let prevTouchJump = false;

let prevTouchFire = false;

// =====================================================================
// 手機版多點觸控虛擬按鍵系統 (Mobile Virtual Controls)
// =====================================================================
function getMobileButtonsLayout() {
  let btnR = constrain(min(width, height) * 0.085, 32, 50);
  let padMargin = btnR + 22;
  let bottomY = height - btnR - 18;

  return {
    left:  { x: padMargin, y: bottomY - btnR * 0.35, r: btnR, label: "◀", color: "rgba(255,255,255,0.28)" },
    right: { x: padMargin + btnR * 2.25, y: bottomY - btnR * 0.35, r: btnR, label: "▶", color: "rgba(255,255,255,0.28)" },
    down:  { x: padMargin + btnR * 1.12, y: bottomY + btnR * 0.65, r: btnR * 0.85, label: "▼", color: "rgba(255,255,255,0.24)" },
    jump:  { x: width - padMargin, y: bottomY - btnR * 0.25, r: btnR * 1.12, label: "JUMP", color: "rgba(52, 199, 89, 0.42)" },
    fire:  { x: width - padMargin - btnR * 2.25, y: bottomY + btnR * 0.15, r: btnR * 0.95, label: "FIRE", color: "rgba(255, 59, 48, 0.42)" },
    dash:  { x: width - padMargin - btnR * 1.15, y: bottomY - btnR * 1.75, r: btnR * 0.85, label: mobileDashLocked ? "DASH\nON" : "DASH\nOFF", color: "rgba(50, 173, 230, 0.42)" }
  };
}

function updateMobileTouchState() {
  if (gameState === "DYING_ANIMATION") {
    touchControls = { left: false, right: false, down: false, jump: false, fire: false };
    prevTouchJump = false;
    prevTouchFire = false;
    return;
  }

  let activePointers = [];
  if (touches && touches.length > 0) {
    for (let t of touches) activePointers.push({ x: t.x, y: t.y });
  }
  if (mouseIsPressed) {
    activePointers.push({ x: mouseX, y: mouseY });
  }

  let nextState = { left: false, right: false, down: false, jump: false, fire: false };

  if (gameState === "PLAYING" && !showSettingsModal && !showExitMapConfirmModal) {
    let layout = getMobileButtonsLayout();
    for (let pt of activePointers) {
      if (dist(pt.x, pt.y, layout.left.x, layout.left.y) < layout.left.r * 1.28) nextState.left = true;
      if (dist(pt.x, pt.y, layout.right.x, layout.right.y) < layout.right.r * 1.28) nextState.right = true;
      if (dist(pt.x, pt.y, layout.down.x, layout.down.y) < layout.down.r * 1.25) nextState.down = true;
      if (dist(pt.x, pt.y, layout.jump.x, layout.jump.y) < layout.jump.r * 1.25) nextState.jump = true;
      if (dist(pt.x, pt.y, layout.fire.x, layout.fire.y) < layout.fire.r * 1.25) nextState.fire = true;
    }

    if (nextState.jump && !prevTouchJump) {
      triggerJumpAction();
    }
    if (!nextState.jump && prevTouchJump) {
      if (velocityY < 0 && powerType !== "feather") {
        velocityY = 0;
        isShortJump = true;
      }
    }
    if (nextState.fire && !prevTouchFire) {
      triggerFireAction();
    }
  }

  prevTouchJump = nextState.jump;
  prevTouchFire = nextState.fire;
  touchControls = nextState;
}

function drawMobileControls() {
  let layout = getMobileButtonsLayout();
  push();
  textFont("Arial Black, sans-serif");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  for (let keyName in layout) {
    let b = layout[keyName];
    let isPressed = (keyName === "dash") ? mobileDashLocked : touchControls[keyName];

    stroke(isPressed ? "#FFD166" : "rgba(255, 255, 255, 0.55)");
    strokeWeight(isPressed ? 4 : 2.5);
    fill(isPressed ? (keyName === "dash" ? "rgba(0, 150, 199, 0.78)" : "rgba(255, 215, 0, 0.55)") : b.color);
    ellipse(b.x, b.y, b.r * 2, b.r * 2);

    noStroke();
    fill(255, 255, 255, isPressed ? 255 : 210);
    textSize(keyName === "dash" ? b.r * 0.34 : (b.label.length > 1 ? b.r * 0.42 : b.r * 0.65));
    text(b.label, b.x, b.y + 1);
  }
  pop();
}

function triggerJumpAction() {
  if (isOnGround && !isActionLocked) {
    velocityY = jumpStrength; 
    isShortJump = false; 

    // 偵測腳下是否踩在流沙 ('Q' 或 'V') 裡，若是則改為「掙扎小跳」
    let checkFootR = floor((characterY + prevHitboxH / 2 - 4) / TILE_SIZE);
    let checkFootC = floor(characterX / TILE_SIZE);
    if (levelMap[checkFootR] && (levelMap[checkFootR][checkFootC] === 'Q' || levelMap[checkFootR][checkFootC] === 'V')) {
      velocityY = -5.5;
    }

    playSFX("jump");
  } else if (!isOnGround) {
    if (powerType === "feather") {
      if (featherFlapsLeft > 0) {
        featherFlapsLeft--;
        velocityY = -13;
        isGliding = true;
        isActionLocked = false;
        playSFX("flap");
      } else {
      isGliding = !isGliding;
    }
    } else {
      isGliding = !isGliding;  
      isActionLocked = false; 
      if (isGliding) {
        if (velocityY > 0) velocityY = 0; 
        else velocityY *= 0.5; 
      }
    }
  }
}

function triggerFireAction() {
  if (!isAttacking && !isCrouching) {
    isAttacking = true;
    hasFiredThisAttack = false; 
    currentFrame = 0; 
    lastFrameTime = millis();
  }
}

function triggerDropReservedItem() {
  if (reservedItem && gameState === "PLAYING") {
    let dropType = reservedItem;
    reservedItem = null;
    playSFX("powerup");
    items.push({
      type: dropType,
      x: characterX,
      y: characterY - 3 * TILE_SIZE,
      vx: 2,
      vy: 0,
      size: 32,
      spawnDelay: 500
    });
  }
}

// =====================================================================
// 《New Super Mario Bros. Wii》風格 UI 系統（大地圖 + 過場卡 + 遊戲 HUD）
// =====================================================================

function handlePointerTap(px, py) {
  initAudioEngine();

  if (gameState === "DYING_ANIMATION") {
    return;
  }

  if (showSettingsModal) {
    handleSettingsModalClick(px, py);
    return;
  }

  if (showExitMapConfirmModal) {
    handleExitMapConfirmClick(px, py);
    return;
  }

  if (gameState === "ITEM_GUIDE") {
    if (millis() - guideOpenTime > 300) {
      activeGuideData = null;
      gameState = "PLAYING";
      playSFX("mapMove");
    }
    return;
  }

  if (gameState === "DEVICE_SELECT") {
    let tb = getDeviceGuideToggleRect();
    if (px >= tb.x && px <= tb.x + tb.w && py >= tb.y && py <= tb.y + tb.h) {
      showItemGuides = !showItemGuides;
      playSFX("mapMove");
      return;
    }

    let cards = getDeviceSelectCards();
    for (let c of cards) {
      if (px > c.x - c.w / 2 && px < c.x + c.w / 2 &&
          py > c.y - c.h / 2 && py < c.y + c.h / 2) {
        controlMode = c.mode;
        if (controlMode === "MOBILE") autoFitMobileZoom = true;
        playSFX("powerup");
        gameState = "WORLD_MAP";
        return;
      }
    }
    return;
  }

  if (gameState === "WORLD_MAP") {
    // 隱藏角落彩蛋：連點左上角角色頭像 5 下啟動創作者模式
    if (dist(px, py, 50, 102) < 28) {
      if (millis() - devLastTapTime < 800) {
        devTapCount++;
      } else {
        devTapCount = 1;
      }
      devLastTapTime = millis();
      if (devTapCount >= 5) {
        devTapCount = 0;
        activateCreatorDebugMode();
      }
      return;
    }
    if (worldTransition.active) return; // 過場動畫期間鎖定操作

    // 處理補給屋點擊領取
    if (showShopModal) {
      let boxW = min(520, width * 0.90);
      let boxH = min(290, height * 0.80);
      let bx = width / 2 - boxW / 2;
      let by = height / 2 - boxH / 2;
      let slotW = (boxW - 72) / 3;
      let slotH = 120;
      let slotY = by + 95;

      for (let i = 0; i < 3; i++) {
        let sx = bx + 20 + i * (slotW + 16);
        if (px >= sx && px <= sx + slotW && py >= slotY && py <= slotY + slotH) {
          let chosen = shopItems[i];
          if (chosen === "1up") {
            lives++;
            playSFX("1up");
          } else {
            // 若身上還沒有 3 階能力就直接裝備，否則存入上方備用道具框
            if (powerLevel < 3) {
              powerLevel = 3;
              powerType = chosen;
            } else {
              reservedItem = chosen;
            }
            playSFX("powerup");
          }
          // 出店門即關門打烊，直到通過任意關卡才再開門
          mapNodesData["2-SHOP"].isOpen = false;
          showShopModal = false;
          return;
        }
      }
      // 點擊視窗外離開（不領取也算離開店門）
      if (px < bx || px > bx + boxW || py < by || py > by + boxH) {
        mapNodesData["2-SHOP"].isOpen = false;
        showShopModal = false;
        playSFX("mapMove");
      }
      return;
    }

    if (px >= width - 156 && px <= width - 30 && py >= 74 && py <= 108) {
      showSettingsModal = true;
      playSFX("mapMove");
      return;
    }

    let itemBtnW = 135;
    let itemBtnH = 44;
    let itemBtnX = width - itemBtnW - 24;
    let itemBtnY = height - itemBtnH - 20;
    if (px >= itemBtnX && px <= itemBtnX + itemBtnW && py >= itemBtnY && py <= itemBtnY + itemBtnH) {
      showMapItemDrawer = !showMapItemDrawer;
      playSFX("mapMove");
      return;
    }

    if (showMapItemDrawer) {
      showMapItemDrawer = false;
      return;
    }

    let nodes = getWorldMapNodes();
    if (controlMode === "MOBILE") {
      let pad = getMobileMapPadRects();
      const hit = (b) => (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
      for (let k of ["up", "down", "left", "right"]) {
        if (hit(pad[k])) {
          moveWorldMapCursor(pad[k].dir);
          return;
        }
      }
      if (hit(pad.go)) {
        enterSelectedMapNode();
        return;
      }
    }
  

    for (let n of nodes) {
      if (dist(px, py, n.x, n.y) < 42) {
        if (!n.unlocked) {
          playSFX("stomp"); // 未解鎖灰色關卡不可進入
          return;
        }
        if (selectedMapNode === n.id) {
          enterSelectedMapNode();
        } else {
          selectedMapNode = n.id;
          playSFX("mapMove");
        }
        return;
      }
    }
    return;
  }

  if (gameState === "PLAYING") {
    let compact = (height < 460);
    let boxSize = compact ? 46 : 58;
    let boxX = width / 2 - boxSize / 2;
    let boxY = compact ? 10 : 18;
    if (px >= boxX && px <= boxX + boxSize && py >= boxY && py <= boxY + boxSize) {
      triggerDropReservedItem();
      return;
    }
    let tBoxX = boxX + boxSize + 12;
  if (currentWorld === 2 && currentLevel === 4 && px >= tBoxX && px <= tBoxX + boxSize && py >= boxY && py <= boxY + boxSize) {
    placeTorchAtPlayer();
    return;
  }

    let btnY = compact ? 66 : 92;
    if (py >= btnY && py <= btnY + 28) {
      if (px >= width - 166 && px <= width - 96) {
        showSettingsModal = true;
        playSFX("mapMove");
        return;
      } else if (px >= width - 90 && px <= width - 20) {
        showExitMapConfirmModal = true;
        playSFX("mapMove");
        return;
      }
    }

    if (controlMode === "MOBILE") {
      let layout = getMobileButtonsLayout();
      if (dist(px, py, layout.dash.x, layout.dash.y) < layout.dash.r * 1.25) {
        mobileDashLocked = !mobileDashLocked;
        dashToggleActive = mobileDashLocked;
        if (mobileDashLocked && powerLevel === 3 && powerType === "chrono") {
          triggerChronoShockwave();
        }
        playSFX("mapMove");
        return;
      }
    }
  }

  if (gameState === "GAME_OVER" && controlMode === "MOBILE") {
    startLevel(currentLevel, true, false);
  } else if (gameState === "ALL_CLEAR" && controlMode === "MOBILE") {
    exitToWorldMapRestoreEntry();
  }
}

function mousePressed() {
  handlePointerTap(mouseX, mouseY);
}

function touchStarted() {
  initAudioEngine();
  if (touches && touches.length > 0) {
    let lastTouch = touches[touches.length - 1];
    handlePointerTap(lastTouch.x, lastTouch.y);
  }
  return false;
}

function touchMoved() {
  return false;
}

function touchEnded() {
  initAudioEngine();
  return false;
}

let devTapCount = 0;

let devLastTapTime = 0;

let devBannerTimer = 0;

function activateCreatorDebugMode() {
  ["1-1", "1-2", "1-3", "1-4", "2-0", "2-SHOP", "2-1", "2-2", "2-3", "2-4", "2-5"].forEach(id => {
    if (mapNodesData[id]) {
      mapNodesData[id].unlocked = true;
      if (id !== "2-4" && id !== "2-5" && id !== "2-SHOP") mapNodesData[id].cleared = true;
    }
  });

  currentWorld = 2;
  selectedMapNode = "2-4";
  let w2Nodes = getWorldMapNodes();
  let n24 = w2Nodes.find(n => n.id === "2-4");
  if (n24) {
    mapAvatarX = n24.x;
    mapAvatarY = n24.y;
  }

  powerLevel = 3;
  powerType = "speed";
  reservedItem = "speed";
  lives = max(lives, 10);

  devBannerTimer = millis() + 2000;
  playSFX("1up");
}

function keyPressed() { 
  initAudioEngine();

  if (gameState === "DYING_ANIMATION") {
    return;
  }

  if (gameState === "ITEM_GUIDE") {
    if (millis() - guideOpenTime > 200) {
      activeGuideData = null;
      gameState = "PLAYING";
      playSFX("mapMove");
    }
    return;
  }

  if (key === 'o' || key === 'O') {
    if (gameState === "WORLD_MAP" || gameState === "PLAYING") {
      showSettingsModal = !showSettingsModal;
      playSFX("mapMove");
    }
    return;
  }

  if (showSettingsModal) {
    if (keyCode === ESCAPE) showSettingsModal = false;
    return;
  }

  if (showExitMapConfirmModal) {
    if (keyCode === ENTER) {
      showExitMapConfirmModal = false;
      exitToWorldMapRestoreEntry();
    } else if (keyCode === ESCAPE || key === 'm' || key === 'M') {
      showExitMapConfirmModal = false;
      playSFX("mapMove");
    }
    return;
  }

  if (gameState === "DEVICE_SELECT") {
    if (key === '1') {
      controlMode = "PC";
      playSFX("powerup");
      gameState = "WORLD_MAP";
    } else if (key === '2') {
      controlMode = "MOBILE";
      autoFitMobileZoom = true;
      playSFX("powerup");
      gameState = "WORLD_MAP";
    }
    return;
  }

  if (key === 'u' || key === 'U') {
    audioMuted = !audioMuted;
    return;
  }

  if (gameState === "WORLD_MAP") {
    if (worldTransition.active) return;
    if (showShopModal) {
      if (keyCode === ESCAPE) {
        mapNodesData["2-SHOP"].isOpen = false;
        showShopModal = false;
      }
      return;
    }
    if (keyCode === 80 || key === 'p' || key === 'P') {
      activateCreatorDebugMode();
      return;
    }
    if (key === 'i' || key === 'I') {
      showMapItemDrawer = !showMapItemDrawer;
      playSFX("mapMove");
      return;
    }
    if (showMapItemDrawer) {
      if (keyCode === ESCAPE || keyCode === 32 || keyCode === ENTER) {
        showMapItemDrawer = false;
      }
      return;
    }

    let curNode = mapNodesData[selectedMapNode];
    let moveDir = null;
    if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') moveDir = "right";
    else if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') moveDir = "left";
    else if (keyCode === UP_ARROW || key === 'w' || key === 'W') moveDir = "up";
    else if (keyCode === DOWN_ARROW || key === 's' || key === 'S') moveDir = "down";

    if (moveDir && curNode && curNode.neighbors) {
      let targetId = curNode.neighbors[moveDir];
      if (targetId === "TO_W1") {
        // 從 2-0 往左走回 World 1：觸發黑色聚光燈轉場
        worldTransition = {
          active: true,
          phase: "WALK_EDGE",
          dir: -1,
          timer: millis(),
          flagProgress: 1,
          roadProgress: 1,
          spotlightR: max(width, height) * 0.75
        };
        playSFX("mapMove");
      } else if (targetId === "TO_W2" && curNode.cleared) {
        // 從 1-4 往右走進 World 2：觸發黑色聚光燈轉場
        worldTransition = {
          active: true,
          phase: "WALK_EDGE",
          dir: 1,
          timer: millis(),
          flagProgress: 1,
          roadProgress: 1,
          spotlightR: max(width, height) * 0.75
        };
        playSFX("mapMove");
      } else if (targetId && mapNodesData[targetId] && mapNodesData[targetId].unlocked) {
        selectedMapNode = targetId;
        playSFX("mapMove");
      } else if (targetId) {
        playSFX("stomp");
      }
      return;
    }

    if (keyCode === ENTER || keyCode === 32) {
      enterSelectedMapNode();
    }
    return;
  }

  if (gameState === "GAME_OVER") {
    if (key === 'r' || key === 'R') {
      startLevel(currentLevel, true, false);
    } else if (key === 'm' || key === 'M') {
      exitToWorldMapRestoreEntry();
    }
    return;
  }

  if (key === 'm' || key === 'M') {
    if (gameState === "PLAYING") {
      showExitMapConfirmModal = true;
      playSFX("mapMove");
    } else if (gameState === "ALL_CLEAR") {
      exitToWorldMapRestoreEntry();
    }
    return;
  }

  if ((key === 'c' || key === 'C') && unlockedNewChar) {
    activeCharacterId = (activeCharacterId === 0) ? 1 : 0;
    playSFX("powerup");
    floatingTexts.push({
      text: activeCharacterId === 1 ? "切換角色：沙漠遊俠！" : "切換角色：原本主角！",
      x: characterX - 55,
      y: characterY - 50,
      vy: -1.4,
      life: 75,
      isOneUp: true
    });
    return;
  }

  if (key === 'r' || key === 'R') {
    startLevel(currentLevel, false, false);
    return;
  }

  if (gameState !== "PLAYING") return;

  // 點按一下 Ctrl 或 Shift 切換衝刺 / 時光領域
  if (keyCode === CONTROL || keyCode === SHIFT) {
    if (powerLevel === 3 && (powerType === "speed" || powerType === "chrono")) {
      dashToggleActive = !dashToggleActive;
      mobileDashLocked = dashToggleActive;
      if (dashToggleActive && powerType === "chrono") {
        triggerChronoShockwave();
      }
      playSFX("mapMove");
    }
    return false;
  }

  if (key === 'b' || key === 'B') {
    triggerDropReservedItem();
    return;
  }

  if (keyCode === 32 || keyCode === 87) { 
  triggerJumpAction();
  return false; 
}

  if (key === 'f' || key === 'F') { 
    triggerFireAction();
  }
  // 2-4 黑暗礦坑按 [E] 或 [T] 在腳下插一根火把
  if ((key === 'e' || key === 'E' || key === 't' || key === 'T') && currentWorld === 2 && currentLevel === 4) {
    placeTorchAtPlayer();
  }
  if ((key === 'c' || key === 'C') && unlockedNewChar) {
    activeCharacterId = (activeCharacterId === 0) ? 1 : 0;
    playSFX("powerup");
    floatingTexts.push({
      text: activeCharacterId === 1 ? "切換角色：沙漠遊俠！" : "切換角色：原本主角！",
      x: characterX - 55,
      y: characterY - 50,
      vy: -1.4,
      life: 75,
      isOneUp: true
    });
  }
} 

function keyReleased() {
  if (gameState === "DYING_ANIMATION") return;
  if ((keyCode === 32 || keyCode === 87) && gameState === "PLAYING") {
    if (velocityY < 0 && powerType !== "feather") {
      velocityY = 0;      
      isShortJump = true; 
    }
  }
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
}

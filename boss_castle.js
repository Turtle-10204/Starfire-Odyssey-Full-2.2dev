// =====================================================================
// boss_castle.js — 1-4 魔王城：火棒、魔王、斧頭、橋崩塌。
// =====================================================================

// 1-4 魔王城專屬系統
let fireBars = [];

let boss = null;

let bossFireballs = [];

let bridgeCollapsing = false;

let bridgeCollapseTimer = 0;

let bridgeTiles = [];

function updateFireBars(playerW, playerH) {
  for (let fb of fireBars) {
    fb.angle += fb.speed;
    if (gameState !== "PLAYING" || invincibleTimer > 0 || starTimer > 0) continue;

    for (let i = 1; i <= fb.count; i++) {
      let fx = fb.cx + cos(fb.angle) * (i * fb.spacing);
      let fy = fb.cy + sin(fb.angle) * (i * fb.spacing);
      if (abs(characterX - fx) < (playerW / 2 + 7) && abs(characterY - fy) < (playerH / 2 + 7)) {
        takeDamage();
        return;
      }
    }
  }
}

function drawFireBars() {
  for (let fb of fireBars) {
    fill("#555555");
    stroke(0);
    strokeWeight(2);
    ellipse(fb.cx, fb.cy, 20, 20);
    noStroke();

    for (let i = 1; i <= fb.count; i++) {
      let fx = fb.cx + cos(fb.angle) * (i * fb.spacing);
      let fy = fb.cy + sin(fb.angle) * (i * fb.spacing);
      fill("#FF4500");
      ellipse(fx, fy, 18, 18);
      fill("#FFD700");
      ellipse(fx, fy, 9, 9);
    }
  }
}

function updateBossAndFireballs(playerW, playerH, viewWorldW = width) {
  if (!boss) return;

  for (let i = bossFireballs.length - 1; i >= 0; i--) {
    let bf = bossFireballs[i];
    bf.x += bf.vx;
    bf.y += (bf.targetY - bf.y) * 0.04;

    if (gameState === "PLAYING" && invincibleTimer <= 0 && starTimer <= 0 &&
        abs(characterX - bf.x) < (playerW / 2 + 12) && abs(characterY - bf.y) < (playerH / 2 + 8)) {
      bossFireballs.splice(i, 1);
      takeDamage();
      return;
    }

    if (bf.x < cameraX - 100 || bf.x > cameraX + viewWorldW + 200) {
      bossFireballs.splice(i, 1);
    }
  }

  if (!boss.alive) return;

  if (boss.flashTimer > 0) boss.flashTimer--;

  if (boss.falling) {
    boss.vy += gravity * 0.7;
    boss.y += boss.vy;
    if (boss.y > 14 * TILE_SIZE) {
      boss.alive = false;
      bossFireballs = [];
    }
    return;
  }

  if (abs(characterX - boss.x) < viewWorldW * 0.85 && gameState === "PLAYING") {
    boss.x += boss.vx;
    if (boss.x <= boss.minX) {
      boss.x = boss.minX;
      boss.vx = abs(boss.vx);
    } else if (boss.x >= boss.maxX) {
      boss.x = boss.maxX;
      boss.vx = -abs(boss.vx);
    }

    if (millis() - boss.lastJumpTime > 2200 && boss.vy === 0) {
      boss.vy = -13;
      boss.lastJumpTime = millis();
    }

    boss.vy += gravity * 0.65;
    boss.y += boss.vy;
    let bridgeTopY = 11 * TILE_SIZE - boss.h / 2;
    if (boss.y >= bridgeTopY) {
      boss.y = bridgeTopY;
      boss.vy = 0;
    }

    if (millis() - boss.lastFireTime > 1900) {
      let aimHigh = random() < 0.5;
      let fireY = aimHigh ? (11 * TILE_SIZE - 68) : (11 * TILE_SIZE - 26);
      bossFireballs.push({
        x: boss.x - boss.w / 2,
        y: boss.y - 10,
        targetY: fireY,
        vx: -5.2
      });
      boss.lastFireTime = millis();
    }

    if (invincibleTimer <= 0 && starTimer <= 0 &&
        abs(characterX - boss.x) < (playerW + boss.w) / 2 - 6 &&
        abs(characterY - boss.y) < (playerH + boss.h) / 2 - 6) {
      takeDamage();
    }
  }
}

function drawBossAndFireballs() {
  for (let bf of bossFireballs) {
    push();
    translate(bf.x, bf.y);
    fill("#FF2A00");
    ellipse(0, 0, 34, 18);
    fill("#FFA500");
    ellipse(-4, 0, 22, 12);
    fill("#FFFF66");
    ellipse(-8, 0, 12, 6);
    pop();
  }

  if (!boss || !boss.alive) return;

  push();
  translate(boss.x, boss.y);

  if (!boss.falling) {
    fill(0);
    rect(-35, -boss.h / 2 - 22, 70, 8, 3);
    fill("#FF3B30");
    rect(-34, -boss.h / 2 - 21, 68 * (boss.hp / boss.maxHp), 6, 2);
  }

  let isFlashing = boss.flashTimer > 0;
  fill(isFlashing ? 255 : "#1B4332");
  arc(10, 5, 62, 68, -HALF_PI, HALF_PI);
  fill(isFlashing ? 255 : "#F8F9FA");
  triangle(36, -15, 48, -10, 38, -2);
  triangle(40, 5, 52, 10, 38, 16);

  fill(isFlashing ? 255 : "#D97706");
  rect(-26, -24, 46, 56, 12);
  fill(isFlashing ? 255 : "#FDE68A");
  rect(-24, -14, 24, 40, 6);

  fill(isFlashing ? 255 : "#15803D");
  rect(-34, -44, 38, 30, 8);
  fill(isFlashing ? 255 : "#DC2626");
  triangle(-22, -44, -10, -56, -4, -44);
  fill(isFlashing ? 255 : "#FFFFFF");
  triangle(-28, -42, -38, -54, -20, -44);

  fill("#FF0000");
  rect(-30, -34, 8, 6);
  fill(255);
  triangle(-32, -20, -28, -14, -24, -20);
  triangle(-22, -20, -18, -14, -14, -20);

  fill(isFlashing ? 255 : "#B45309");
  rect(-22, 28, 18, 14, 4);
  rect(4, 28, 18, 14, 4);
  pop();
}

function checkAxeTrigger(cx, cy, cw, ch) {
  let col = floor(cx / TILE_SIZE);
  let row = floor(cy / TILE_SIZE);
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
        if (levelMap[r][c] === 'A') {
          levelMap[r][c] = ' ';
          bridgeCollapsing = true;
          bridgeCollapseTimer = millis();
          bossFireballs = [];
          score += 15000;
          playSFX("clear");
          floatingTexts.push({ text: "+15000 AXE CLEAR!", x: c * TILE_SIZE - 40, y: r * TILE_SIZE - 30, vy: -1.5, life: 120 });

          characterX = c * TILE_SIZE + TILE_SIZE / 2;
          characterY = (r + 1) * TILE_SIZE - ch / 2 - 0.1;
          velocityY = 0;
          isOnGround = true;

          gameState = "BOSS_DEFEAT_CUTSCENE";
          isAttacking = false;
          isCrouching = false;
          return;
        }
      }
    }
  }
}

function updateBridgeCollapse() {
  if (!bridgeCollapsing) return;
  if (millis() - bridgeCollapseTimer > 65) {
    bridgeCollapseTimer = millis();
    if (bridgeTiles.length > 0) {
      let tilePos = bridgeTiles.shift();
      levelMap[tilePos.r][tilePos.c] = ' ';
      playSFX("brick");
      spawnBrickParticles(tilePos.c * TILE_SIZE + TILE_SIZE / 2, tilePos.r * TILE_SIZE + TILE_SIZE / 2);
    } else {
      bridgeCollapsing = false;
      if (boss && boss.alive) {
        boss.falling = true;
        boss.vy = 2;
      }
    }
  }
}

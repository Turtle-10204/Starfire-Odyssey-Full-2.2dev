// =====================================================================
// player.js — 主角受傷死亡、時光倒流、火球與仙人掌飛針。
// =====================================================================

function getPowerTintColor(type) {
  if (type === "fire") return color(255, 165, 130);
  if (type === "feather") return color(255, 245, 150);
  if (type === "speed") return color(135, 225, 255);
  if (type === "cactus") return color(130, 235, 160);
  if (type === "chrono") return color(255, 220, 120);
  return color(255);
}

function takeDamage() {
  if (gameState !== "PLAYING" || invincibleTimer > 0 || starTimer > 0) return;
  playerStunTimer = 0;
  if (tryChronoTimeRewind()) return;
  if (powerLevel === 3) {
    powerLevel = 2;
    powerType = "mushroom";
    currentSprintBonus = 0;
    playSFX("shrink");
    gameState = "TRANSFORM_FREEZE";
    transformTimer = 500;
    transformIsDamage = true;
    transformFromBig = true;
    transformToBig = true;
    isAttacking = false;
    isCrouching = false;
    isGliding = false;
  } else if (powerLevel === 2) {
    powerLevel = 1;
    powerType = "none";
    currentSprintBonus = 0;
    playSFX("shrink");
    gameState = "TRANSFORM_FREEZE";
    transformTimer = 500;
    transformIsDamage = true;
    transformFromBig = true;
    transformToBig = false;
    isAttacking = false;
    isCrouching = false;
    isGliding = false;
  } else {
    handlePlayerDeath();
  }
}

function handlePlayerDeath() {
  if (tryChronoTimeRewind()) return; // <--- 新增這行（掉進深淵/岩漿也能回溯保命）
  lives--;
  playSFX("death");
  if (lives <= 0) {
    lives = 0;
    gameState = "GAME_OVER";
  } else {
    startLevel(currentLevel, false, false);
  }
}

function updatePlayerFireballs() {
  for (let i = playerFireballs.length - 1; i >= 0; i--) {
    let fb = playerFireballs[i];
    fb.x += fb.vx;
    fb.vy += gravity * 0.28;
    fb.y += fb.vy;
    fb.life--;

    let dir = fb.vx >= 0 ? 1 : -1;
    let targetY = null;
    let nearestDist = 420;

    for (let en of enemies) {
      if (en.dead) continue;
      let dx = (en.x - fb.x) * dir;
      if (dx > 0 && dx < nearestDist && abs(en.y - fb.y) < 150) {
        nearestDist = dx;
        targetY = en.y;
      }
    }

    if (targetY === null && currentLevel === 4 && boss && boss.alive && !boss.falling) {
      let dx = (boss.x - fb.x) * dir;
      if (dx > 0 && dx < 500 && abs(boss.y - fb.y) < 180) {
        targetY = boss.y;
      }
    }

    if (targetY !== null) {
      fb.vy += (targetY - fb.y) * 0.018;
      fb.vy = constrain(fb.vy, -7, 7);
    }

    if (checkCollision(fb.x, fb.y + 6, 12, 12) && fb.vy > 0) {
      fb.vy = -7.5;
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      let en = enemies[ei];
      if (!en.dead && abs(fb.x - en.x) < en.w / 2 + 18 && abs(fb.y - en.y) < en.h / 2 + 18) {
        en.dead = true;
        en.vy = -7;
        score += 300;
        playSFX("kick");
        floatingTexts.push({ text: "+300", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
        fb.life = 0;
        break;
      }
    }

    if (currentLevel === 4 && boss && boss.alive && !boss.falling) {
      if (abs(fb.x - boss.x) < boss.w / 2 + 14 && abs(fb.y - boss.y) < boss.h / 2 + 14) {
        boss.hp -= 3;
        boss.flashTimer = 8;
        score += 600;
        fb.life = 0;
        if (boss.hp <= 0) {
          boss.falling = true;
          boss.vy = -6;
          score += 15000;
          playSFX("clear");
          floatingTexts.push({ text: "+15000 BOSS DEFEATED!", x: boss.x - 60, y: boss.y - 60, vy: -1.5, life: 120 });
          gameState = "BOSS_DEFEAT_CUTSCENE";
        }
      }
    }

    if (fb.life <= 0 || fb.y > levelMap.length * TILE_SIZE + 50) {
      playerFireballs.splice(i, 1);
    }
  }
}

function drawPlayerFireballs() {
  for (let fb of playerFireballs) {
    push();
    translate(fb.x, fb.y);
    noStroke();
    fill("#FF2A00");
    ellipse(0, 0, 18, 18);
    fill("#FFD166");
    ellipse(0, 0, 10, 10);
    pop();
  }
} // ← 原本這裡多了一個 }，已移除

function updateCactusNeedles() {
  for (let i = cactusNeedles.length - 1; i >= 0; i--) {
    let nd = cactusNeedles[i];
    nd.x += nd.vx;
    nd.life--;

    // 穿透擊殺沿途所有怪物
    for (let en of enemies) {
      if (!en.dead && abs(nd.x - en.x) < en.w / 2 + 14 && abs(nd.y - en.y) < en.h / 2 + 12) {
        en.dead = true;
        en.vy = -7;
        score += 250;
        playSFX("kick");
        floatingTexts.push({ text: "+250", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
      }
    }

    // 碰到仙人掌刺柱直接擊碎並繼續穿透，碰到硬牆才消失
    let c = floor(nd.x / TILE_SIZE);
    let r = floor(nd.y / TILE_SIZE);
    if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
      let t = levelMap[r][c];
      if (t === 'K') {
        levelMap[r][c] = ' ';
        spawnBrickParticles(c * TILE_SIZE + 20, r * TILE_SIZE + 20);
        playSFX("brick");
      } else if (t === 'G' || t === 'B' || t === 'S' || t === 'P' || t === 'E' || t === '?' || t === 'M') {
        nd.life = 0;
      }
    }

    if (nd.life <= 0) cactusNeedles.splice(i, 1);
  }
}

function triggerChronoShockwave() {
  chronoWaveTimer = 450;
  playSFX("powerup");
  for (let en of enemies) {
    if (!en.dead && dist(en.x, en.y, characterX, characterY) < 260) {
      en.stunTimer = 2500; // 領域內敵人定格暈眩 2.5 秒，可直接撞飛！
      en.vx = 0;
    }
  }
}

function tryChronoTimeRewind() {
  if (powerLevel === 3 && powerType === "chrono" && safePositionHistory.length > 0) {
    let rewindPt = safePositionHistory[0];
    characterX = rewindPt.x;
    characterY = rewindPt.y;
    velocityY = 0;
    knockbackVX = 0;
    powerLevel = 2;
    powerType = "mushroom";
    dashToggleActive = false;
    mobileDashLocked = false;
    chronoFieldActive = false;
    invincibleTimer = 1800;
    playSFX("1up");
    floatingTexts.push({
      text: "⏳ TIME REWIND!",
      x: characterX - 55,
      y: characterY - 50,
      vy: -1.5,
      life: 90,
      isOneUp: true
    });
    return true;
  }
  return false;
}

function drawCactusNeedles() {
  for (let nd of cactusNeedles) {
    push();
    translate(nd.x, nd.y);
    noStroke();
    fill("#38B000");
    rect(-12, -3, 24, 6, 3);
    fill("#FFF3B0");
    triangle(nd.vx > 0 ? 12 : -12, -4, nd.vx > 0 ? 18 : -18, 0, nd.vx > 0 ? 12 : -12, 4);
    pop();
  }
}

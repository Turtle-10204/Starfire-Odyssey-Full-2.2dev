// =====================================================================
// entities.js — 敵人、道具、金幣、浮動文字的生成/更新/繪製。
// =====================================================================

function triggerOneUp(x, y) {
  lives++;
  playSFX("1up");
  floatingTexts.push({
    text: "1UP",
    x: x - 18,
    y: y - 20,
    vy: -1.8,
    life: 95,
    isOneUp: true
  });
}

function addCoinAndScore(cx, cy) {
  score += 100;
  coinCount++;
  playSFX("coin");
  coins.push({
    x: cx,
    y: cy,
    vy: -8,
    life: 20
  });
  if (coinCount >= 10) {
    coinCount -= 10;
    triggerOneUp(characterX, characterY - 30);
  }
}

function spawnLevelEnemies(lvl) {
  enemies = [];
  const createEnemy = (type, col, row) => {
    let h = type === "goomba" ? 30 : 38;
    return {
      type: type,
      x: col * TILE_SIZE + 20,
      y: row * TILE_SIZE - h / 2 - 12,
      baseY: row * TILE_SIZE - h / 2 - 24,
      w: 30,
      h: h,
      vx: -1.4,
      vy: 0,
      shellMoving: false,
      dead: false,
      flyPhase: random(TWO_PI),
      stunTimer: 0,
      knockbackX: 0
    };
  };
  if (lvl === 1) {
    enemies.push(createEnemy("goomba", 22, 13));
    enemies.push(createEnemy("goomba", 42, 13));
    enemies.push(createEnemy("koopa", 56, 13));
    enemies.push(createEnemy("goomba", 82, 13));
    enemies.push(createEnemy("goomba", 85, 13));
    enemies.push(createEnemy("koopa", 118, 13));
    enemies.push(createEnemy("goomba", 142, 13));
  } else if (lvl === 2) {
    enemies.push(createEnemy("goomba", 18, 13));
    enemies.push(createEnemy("koopa", 36, 13));
    enemies.push(createEnemy("goomba", 62, 13));
    enemies.push(createEnemy("goomba", 92, 13));
    enemies.push(createEnemy("koopa", 125, 13));
  } else if (lvl === 3) {
    enemies.push(createEnemy("parakoopa", 32, 8));
    enemies.push(createEnemy("goomba", 56, 8));
    enemies.push(createEnemy("parakoopa", 72, 7));
    enemies.push(createEnemy("parakoopa", 112, 7));
    enemies.push(createEnemy("koopa", 155, 13));
  } else if (lvl === 4) {
    enemies.push(createEnemy("goomba", 33, 13));
    enemies.push(createEnemy("koopa", 64, 13));
    enemies.push(createEnemy("goomba", 142, 13));
  }
}

function updateEnemies(playerW, playerH, viewWorldW = width) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let en = enemies[i];

    if (en.dead) {
      en.vy += gravity * 0.6;
      en.y += en.vy;
      if (en.y > levelMap.length * TILE_SIZE + 100) {
        enemies.splice(i, 1);
      }
      continue;
    }

    if (abs(en.x - characterX) > viewWorldW * 1.15) continue;

    let inChrono = (chronoFieldActive && dist(en.x, en.y, characterX, characterY) < 260);
    let timeScale = inChrono ? 0.25 : 1.0;

    // 處理暈眩倒數與被撞退滑行
    let isStunned = false;
    if (en.stunTimer && en.stunTimer > 0) {
      en.stunTimer -= deltaTime;
      if (en.stunTimer < 0) en.stunTimer = 0;
      isStunned = (en.stunTimer > 0);
    }

    if (en.knockbackX && abs(en.knockbackX) > 0.1) {
      en.x += en.knockbackX;
      if (checkCollision(en.x, en.y - 2, en.w, en.h - 4)) {
        en.x -= en.knockbackX;
        en.knockbackX = 0;
      } else {
        en.knockbackX *= 0.84;
      }
    } else {
      en.knockbackX = 0;
    }

    if (en.type === "parakoopa") {
      if (!isStunned) {
        en.x += en.vx * 0.8 * timeScale;
        if (checkCollision(en.x, en.y, en.w, en.h)) {
          en.x -= en.vx * 0.8 * timeScale;
          en.vx *= -1;
        }

        if (!en.flyDir) en.flyDir = -1;
        let nextY = en.y + en.flyDir * 1.6;
        if (abs(nextY - en.baseY) > 48 || checkCollision(en.x, nextY, en.w, en.h)) {
          en.flyDir *= -1;
        } else {
          en.y = nextY;
        }
      } else {
        // 暈眩時受重力落到地面上
        en.vy += gravity * 0.6;
        en.y += en.vy;
        if (checkCollision(en.x, en.y, en.w, en.h) && en.vy >= 0) {
          let guard = 0;
          while (checkCollision(en.x, en.y, en.w, en.h) && guard < 60) {
            en.y -= 1;
            guard++;
          }
          en.vy = 0;
        }
      }
    } else {
      if (!isStunned) {
        en.x += en.vx * timeScale;
        if (checkCollision(en.x, en.y - 2, en.w, en.h - 4)) {
          en.x -= en.vx * timeScale;
          en.vx *= -1;
          let nudgeDir = en.vx >= 0 ? 1 : -1;
          let safety = 0;
          while (checkCollision(en.x, en.y - 2, en.w, en.h - 4) && safety < 20) {
            en.x += nudgeDir * 2;
            safety++;
          }
          if (en.type === "shell" && en.shellMoving) {
            playSFX("stomp");
          }
        }
      }

      en.vy += gravity * 0.6;
      en.y += en.vy;
      if (checkCollision(en.x, en.y, en.w, en.h)) {
        if (en.vy >= 0) {
          let guard = 0;
          while (checkCollision(en.x, en.y, en.w, en.h) && guard < 60) {
            en.y -= 1;
            guard++;
          }
          en.vy = 0;
        }
      }
    }

    if (en.type === "shell" && en.shellMoving) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (i === j) continue;
        let other = enemies[j];
        if (!other.dead && abs(en.x - other.x) < (en.w + other.w) / 2 && abs(en.y - other.y) < (en.h + other.h) / 2) {
          other.dead = true;
          other.vy = -7;
          score += 400;
          playSFX("kick");
          floatingTexts.push({ text: "+400", x: other.x, y: other.y - 20, vy: -1.5, life: 45 });
        }
      }
    }

    if (en.y > levelMap.length * TILE_SIZE + 100) {
      enemies.splice(i, 1);
      continue;
    }

    let hurtW = (en.type === "parakoopa") ? 18 : (en.w - 6);
    let hurtH = (en.type === "parakoopa") ? 22 : (en.h - 6);

    if (gameState === "PLAYING" &&
        abs(characterX - en.x) < (playerW + hurtW) / 2 &&
        abs(characterY - en.y) < (playerH + hurtH) / 2) {

      let midX = (characterX + en.x) / 2;
      let midY = (characterY + en.y) / 2;
      let midC = floor(midX / TILE_SIZE);
      let midR = floor(midY / TILE_SIZE);
      if (midR >= 0 && midR < levelMap.length && midC >= 0 && midC < levelMap[0].length) {
        let midTile = levelMap[midR][midC];
        if (midTile !== ' ' && midTile !== 'I' && midTile !== 'A' && midTile !== 'L' && midTile !== 'F' && midTile !== '|' && midTile !== 'C' && midTile !== 'O') {
          continue;
        }
      }

      if (starTimer > 0 || inChrono) {
        en.dead = true;
        en.vy = -8;
        score += (starTimer > 0 ? 300 : 250);
        playSFX("kick");
        floatingTexts.push({ text: starTimer > 0 ? "+300" : "CHRONO! +250", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
        continue;
      }

      let playerBottom = characterY + playerH / 2;
      let isStomp = (velocityY > 0 && playerBottom <= en.y + en.h * 0.45) ||
                    (playerBottom <= en.y + 6 && characterY < en.y);

      if (isStomp) {
        // 已取消踩怪後人物閃爍（不再設 invincibleTimer = 250）
        velocityY = -14;
        isOnGround = false;
        isGliding = false;
        isActionLocked = false;
        isShortJump = false;
        featherFlapsLeft = 2;

        if (en.type === "goomba") {
          en.dead = true;
          en.vy = -3;
          score += 200;
          playSFX("stomp");
          floatingTexts.push({ text: "+200", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
        } else if (en.type === "parakoopa") {
          en.type = "koopa";
          en.vy = 0;
          score += 200;
          playSFX("stomp");
          floatingTexts.push({ text: "+200", x: en.x, y: en.y - 20, vy: -1.5, life: 45 });
        } else if (en.type === "koopa") {
          en.type = "shell";
          en.y += (en.h - 26) / 2;
          en.h = 26;
          en.vx = 0;
          en.shellMoving = false;
          score += 200;
          playSFX("stomp");
        } else if (en.type === "shell") {
          if (!en.shellMoving) {
            en.shellMoving = true;
            en.vx = (characterX < en.x ? 8 : -8);
            playSFX("kick");
          } else {
            en.shellMoving = false;
            en.vx = 0;
            playSFX("stomp");
          }
        }
      } else if (en.type === "shell" && !en.shellMoving) {
        let isSpeedBoost = (powerType === "speed" && currentSprintBonus > 0.2);
        en.shellMoving = true;
        en.vx = (characterX < en.x ? 1 : -1) * (isSpeedBoost ? 16 : 8);
        score += 100;
        playSFX("kick");
        if (isSpeedBoost) {
          floatingTexts.push({ text: "2X SHELL SPEED!", x: en.x - 45, y: en.y - 25, vy: -1.4, life: 50 });
        }
      } else if (en.type === "shell" && en.shellMoving && powerType === "speed" && currentSprintBonus > 0.2) {
        let dir = (en.vx !== 0) ? Math.sign(en.vx) : (characterX < en.x ? 1 : -1);
        en.vx = dir * 16;
        en.stunTimer = 0;
        score += 100;
        playSFX("kick");
        floatingTexts.push({ text: "2X SHELL SPEED!", x: en.x - 45, y: en.y - 25, vy: -1.4, life: 50 });
      } else if (powerLevel === 3 && powerType === "cactus" && isCrouching) {
        let pushDir = (en.x >= characterX) ? 1 : -1;
        en.dead = true;
        en.vy = -8;
        knockbackVX = -pushDir * 6.5;
        score += 250;
        playSFX("kick");
        floatingTexts.push({ text: "THORN! +250", x: en.x - 20, y: en.y - 25, vy: -1.5, life: 50 });
        continue;
      } else if (en.type !== "shell" && powerType === "speed" && currentSprintBonus >= 0.9) {
        // 加速菇滿速閾值撞擊：撞退並暈眩怪物 3 秒，雙方均向後反彈！
        let pushDir = (en.x >= characterX) ? 1 : -1;
        en.stunTimer = 3000;
        en.knockbackX = pushDir * 9.5;
        en.vy = -4.5;
        knockbackVX = -pushDir * 7.5;
        currentSprintBonus = 0.25;
        score += 150;
        playSFX("kick");
        floatingTexts.push({ text: "STUN! +150", x: en.x - 24, y: en.y - 28, vy: -1.4, life: 50 });
      } else if (isStunned) {
        // 怪物暈眩期間碰撞完全不會受傷
        continue;
      } else {
        takeDamage();
        return;
      }
    }
  }
}

function drawEnemies() {
  for (let en of enemies) {
    let isStunned = (en.stunTimer && en.stunTimer > 0 && !en.dead);

    push();
    translate(en.x, en.y);
    if (en.dead) scale(1, -1);

    // 暈眩時怪物身體微微左右搖晃
    if (isStunned) {
      rotate(sin(frameCount * 0.45) * 0.14);
    }

    if (en.type === "goomba") {
      noStroke();
      fill("#8D5524");
      arc(0, 2, 30, 28, PI, TWO_PI);
      fill("#F1C27D");
      rect(-8, 2, 16, 10, 3);
      fill(255);
      ellipse(-5, -4, 6, 8);
      ellipse(5, -4, 6, 8);
      fill(0);
      ellipse(-4, -4, 3, 5);
      ellipse(4, -4, 3, 5);
      let footShift = isStunned ? 0 : sin(frameCount * 0.25) * 3;
      fill("#3D1E16");
      ellipse(-7 + footShift, 13, 10, 6);
      ellipse(7 - footShift, 13, 10, 6);
    } else if (en.type === "koopa" || en.type === "parakoopa") {
      let dir = en.vx >= 0 ? 1 : -1;
      scale(dir, 1);
      noStroke();
      fill(en.type === "parakoopa" ? "#E63946" : "#2EC4B6");
      arc(-2, 3, 28, 32, PI, TWO_PI);
      stroke(255);
      strokeWeight(1.5);
      arc(-2, 3, 28, 32, PI, TWO_PI);
      noStroke();
      fill("#FFD166");
      ellipse(10, -9, 14, 16);
      fill(255);
      ellipse(12, -11, 5, 7);
      fill(0);
      ellipse(13, -11, 2.5, 4);
      fill("#F4A261");
      let walkShift = isStunned ? 0 : sin(frameCount * 0.25) * 3;
      ellipse(-6 + walkShift, 15, 10, 7);
      ellipse(6 - walkShift, 15, 10, 7);

      if (en.type === "parakoopa") {
        fill(255);
        stroke("#ADB5BD");
        strokeWeight(1.5);
        let flap = isStunned ? 0 : sin(frameCount * 0.35) * 6;
        ellipse(-8, -9 + flap, 14, 22);
      }
    } else if (en.type === "shell") {
      noStroke();
      fill("#2EC4B6");
      arc(0, 6, 28, 24, PI, TWO_PI);
      fill(255);
      rect(-14, 6, 28, 5, 2);
    }
    pop();

    // 暈眩 3 秒期間：在怪物頭頂畫出 3 顆環繞旋轉的「眼冒金星」特效！
    if (isStunned) {
      push();
      translate(en.x, en.y - en.h / 2 - 12);
      noFill();
      stroke(255, 215, 0, 120);
      strokeWeight(1.5);
      ellipse(0, 0, 32, 10);

      for (let s = 0; s < 3; s++) {
        let ang = frameCount * 0.16 + s * (TWO_PI / 3);
        let sx = cos(ang) * 16;
        let sy = sin(ang) * 5;
        push();
        translate(sx, sy);
        rotate(frameCount * 0.1);
        noStroke();
        fill("#FFD700");
        beginShape();
        for (let p = 0; p < 10; p++) {
          let r = (p % 2 === 0) ? 5.5 : 2.3;
          let a = -HALF_PI + p * PI / 5;
          vertex(cos(a) * r, sin(a) * r);
        }
        endShape(CLOSE);
        pop();
      }
      pop();
    }
  }
}

function spawnPowerupFromBlock(tileChar, spawnX, spawnY) {
  playSFX("powerup");
  let spawnedType = "mushroom";

  if (tileChar === '*') {
    spawnedType = "star";
  } else if (powerLevel >= 2) {
    let pool = (currentWorld >= 2)
      ? ["fire", "feather", "speed", "cactus", "chrono"]
      : ["fire", "feather", "speed"];
    spawnedType = pool[nextPowerCycle % pool.length];
    nextPowerCycle++;
  }

  // 確保生成高度貼齊方塊正上方，不會飛進上一排磚塊
  let blockRow = floor((spawnY + TILE_SIZE / 2) / TILE_SIZE);
  let safeSpawnY = blockRow * TILE_SIZE - 16.5;

  items.push({
    type: spawnedType,
    x: spawnX,
    y: safeSpawnY,
    vx: 2.2,
    vy: spawnedType === "star" ? -3.2 : -1.5,
    size: 32,
    spawnDelay: 0
  });
}

function updateAndDrawItems(playerW, playerH) {
  for (let i = items.length - 1; i >= 0; i--) {
    let it = items[i];

    if (it.spawnDelay && it.spawnDelay > 0) {
      it.spawnDelay -= deltaTime;
      if (floor(it.spawnDelay / 100) % 2 === 0) {
        drawPowerupIcon(it.type, it.x, it.y, 1.0);
      }
      continue;
    }

    if (it.type !== "fire") {
      it.x += it.vx;
      if (checkCollision(it.x, it.y, it.size, it.size)) {
        it.x -= it.vx;
        it.vx *= -1;
      }
    }

    it.vy += gravity * 0.6;
    it.y += it.vy;
    if (checkCollision(it.x, it.y, it.size, it.size)) {
      if (it.vy > 0) {
        let bottomRow = floor((it.y + it.size / 2) / TILE_SIZE);
        it.y = bottomRow * TILE_SIZE - it.size / 2 - 0.1;
        it.vy = (it.type === "star") ? -10 : 0;
      }
    }

    drawPowerupIcon(it.type, it.x, it.y, 1.0);

    if (abs(characterX - it.x) < (playerW + it.size) / 2 &&
        abs(characterY - it.y) < (playerH + it.size) / 2) {
      score += 1000;
      items.splice(i, 1);

      if (it.type === "star") {
        starTimer = 8000;
        playSFX("powerup");
        floatingTexts.push({ text: "STAR POWER!", x: characterX - 45, y: characterY - 55, vy: -1.5, life: 70 });
        triggerFirstTimeItemGuide("star");
        continue;
      }

      if (it.type === "mushroom") {
        if (powerLevel === 1) {
          transformFromBig = false;
          transformToBig = true;
          powerLevel = 2;
          powerType = "mushroom";
          playSFX("powerup");
          if (!triggerFirstTimeItemGuide("mushroom")) {
            gameState = "TRANSFORM_FREEZE";
            transformTimer = 500;
            transformIsDamage = false;
          }
        } else {
          reservedItem = "mushroom";
          playSFX("coin");
          floatingTexts.push({ text: "ITEM STORED!", x: characterX - 40, y: characterY - 55, vy: -1.5, life: 60 });
        }
      } else {
        if (powerLevel === 1 || powerLevel === 2) {
          transformFromBig = (powerLevel >= 2);
          transformToBig = true;
          powerLevel = 3;
          powerType = it.type;
          playSFX("powerup");
          if (!triggerFirstTimeItemGuide(it.type)) {
            gameState = "TRANSFORM_FREEZE";
            transformTimer = 500;
            transformIsDamage = false;
          }
        } else {
          if (powerType !== it.type) {
            reservedItem = powerType;
            powerType = it.type;
            playSFX("powerup");
            floatingTexts.push({ text: "POWER SWAP!", x: characterX - 40, y: characterY - 55, vy: -1.5, life: 60 });
            triggerFirstTimeItemGuide(it.type);
          } else {
            reservedItem = it.type;
            playSFX("coin");
            floatingTexts.push({ text: "ITEM STORED!", x: characterX - 40, y: characterY - 55, vy: -1.5, life: 60 });
          }
        }
      }
      continue;
    }

    if (it.y > levelMap.length * TILE_SIZE + 100) {
      items.splice(i, 1);
    }
  }
}

function updateAndDrawFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let ft = floatingTexts[i];
    ft.y += ft.vy;
    ft.life--;

    push();
    if (ft.isOneUp) {
      fill("#4CD137");
      stroke(0);
      strokeWeight(5);
      textSize(30);
      textStyle(BOLD);
    } else {
      fill("#FFD700");
      stroke(0);
      strokeWeight(4);
      textSize(24);
      textStyle(NORMAL);
    }
    textAlign(LEFT, CENTER);
    text(ft.text, ft.x, ft.y);
    pop();

    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function updateAndDrawCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    let c = coins[i];
    c.y += c.vy; 
    c.vy += 0.6; 
    c.life--;

    fill("#FFD700");
    stroke("#B8860B");
    strokeWeight(2);
    ellipse(c.x, c.y, 16, 22);
    noStroke();

    if (c.life <= 0) {
      coins.splice(i, 1);
    }
  }
}

function checkCollectOpenCoins(cx_w, cy_h) {
  let startCol = floor((characterX - cx_w / 2) / TILE_SIZE);
  let endCol   = floor((characterX + cx_w / 2) / TILE_SIZE);
  let startRow = floor((characterY - cy_h / 2) / TILE_SIZE);
  let endRow   = floor((characterY + cy_h / 2) / TILE_SIZE);

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
        if (levelMap[r][c] === 'O') {
          levelMap[r][c] = ' ';
          addCoinAndScore(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
        }
      }
    }
  }
}

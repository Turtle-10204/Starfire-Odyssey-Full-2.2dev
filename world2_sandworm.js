// =====================================================================
// world2_sandworm.js — 2-5 沙暴巨蟲 BOSS 與解救新角色過場。
// =====================================================================

// <--- 新增以下變數：沙暴巨蟲 BOSS 系統、拯救新角色過場動畫、角色切換系統
let sandwormBoss = null;           // 2-5 沙暴巨蟲實體

let wormRocks = [];                // 招式1：巨石下落陣列

let playerStunTimer = 0;           // 衝刺菇撞到巨蟲刺甲後的 3 秒自暈計時器

let unlockedNewChar = false;       // 是否已擊敗沙暴巨蟲並解鎖新角色

let activeCharacterId = 0;         // 0 = 原本主角, 1 = 解放的新角色（可按 C 切換）

let rescueCutscene = null;         // 走出神殿大門後的拯救新角色過場動畫狀態

// =====================================================================
// 2-5 沙暴巨蟲 BOSS 系統（5大招式＋巨型體節＋踩後震波反制＋完整過關修復）
// =====================================================================
let wormShockwaves = []; // 招式4落地沙浪衝擊波

function updateSandwormBoss(playerW, playerH) {
  if (!sandwormBoss) return;
  let b = sandwormBoss;
  if (!b.sandDust) b.sandDust = [];

  // 1. 玩家走進 48 格大競技場後自動關門開戰
  if (!b.active && !b.doorOpened && characterX > b.arenaLeft + 90) {
    b.active = true;
    b.doorLocked = true;
    wormShockwaves = [];
    playSFX("brick");
    floatingTexts.push({ text: "⚠ 沙暴巨蟲覺醒！抓準喘息時機攻擊尾部弱點！", x: characterX - 110, y: characterY - 80, vy: -1, life: 130 });
  }

  // 開戰期間把玩家限制在競技場左右石門之間，避免穿牆
  if (b.doorLocked && gameState === "PLAYING") {
    characterX = constrain(characterX, b.arenaLeft + 24, b.arenaRight - 24);
  }

  // 更新掉落巨石（招式1）
  for (let i = wormRocks.length - 1; i >= 0; i--) {
    let rk = wormRocks[i];
    if (rk.warnTimer > 0) {
      rk.warnTimer--;
      continue;
    }
    rk.vy += 0.48;
    rk.y += rk.vy;
    if (gameState === "PLAYING" && invincibleTimer <= 0 && starTimer <= 0 &&
        abs(characterX - rk.x) < (playerW / 2 + rk.r * 0.75) &&
        abs(characterY - rk.y) < (playerH / 2 + rk.r * 0.75)) {
      wormRocks.splice(i, 1);
      takeDamage();
      return;
    }
    if (rk.y > 13.5 * TILE_SIZE) {
      wormRocks.splice(i, 1);
    }
  }

  // 更新落地沙浪衝擊波（招式4）
  for (let i = wormShockwaves.length - 1; i >= 0; i--) {
    let sw = wormShockwaves[i];
    sw.x += sw.vx;
    sw.life--;
    if (gameState === "PLAYING" && invincibleTimer <= 0 && starTimer <= 0 &&
        abs(characterX - sw.x) < (playerW / 2 + 16) &&
        abs(characterY - sw.y) < (playerH / 2 + 24)) {
      wormShockwaves.splice(i, 1);
      takeDamage();
      return;
    }
    if (sw.life <= 0 || sw.x < b.arenaLeft || sw.x > b.arenaRight) {
      wormShockwaves.splice(i, 1);
    }
  }

  if (b.hurtFlash > 0) b.hurtFlash--;
  if (!b.active || b.state === "DEFEATED") {
    // 擊敗後走到神殿右側大門：觸發拯救新角色或直接過關
    if (b.doorOpened && gameState === "PLAYING" && characterX > b.arenaRight - 80) {
      if (!unlockedNewChar && !rescueCutscene) {
        rescueCutscene = {
          timer: 0,
          cageX: b.arenaRight - 36,
          cageY: 13 * TILE_SIZE
        };
      } else if (unlockedNewChar && !rescueCutscene) {
        gameState = "WALK_TO_CASTLE";
        castleTargetX = b.arenaRight + 20;
      }
    }
    return;
  }

  b.timer--;
  let floorY = 12 * TILE_SIZE + 4;
  let undergroundY = 15.5 * TILE_SIZE; // 藏在地底下的高度

  // === 5 種攻擊模組狀態機 ===
  if (b.state === "IDLE") {
    // 平時巨蟲保持「高昂警戒姿態」，尾部弱點半埋進沙地裡，不會輕易露出來給人白踩！
    b.headX += sin(frameCount * 0.06) * 2.2;
    b.headY = lerp(b.headY, 8.5 * TILE_SIZE, 0.08);
    if (b.timer <= 0) {
      let pool = ["ROCKFALL", "TRAIN_CHARGE", "BURROW_AMBUSH", "ARC_LEAP", "HYPER_BEAM"].filter(a => a !== b.lastAttack);
      b.nextAttack = random(pool);
      b.lastAttack = b.nextAttack;
      b.state = "TELEGRAPH";
      b.timer = 50;
      playSFX("stomp");
    }
  } else if (b.state === "TELEGRAPH") {
    // 前搖蓄力震動
    b.headX += sin(frameCount * 0.9) * 4;
    if (b.timer <= 0) {
      b.state = b.nextAttack;
      if (b.state === "ROCKFALL") {
        // 【招式 1：天崩巨石雨】
        b.timer = 120;
        for (let k = 0; k < 8; k++) {
          wormRocks.push({
            x: random(b.arenaLeft + 80, b.arenaRight - 80),
            y: 45, vy: 0, r: 22, warnTimer: 35 + k * 9
          });
        }
      } else if (b.state === "TRAIN_CHARGE") {
        // 【招式 2：裝甲列車雙趟狂衝】
        b.dir = (characterX < b.headX) ? -1 : 1;
        b.headX = (b.dir === -1) ? (b.arenaRight - 50) : (b.arenaLeft + 50);
        b.headY = floorY;
        b.vx = b.dir * 11.5;
        b.chargeBounces = 1;
        b.timer = 140;
      } else if (b.state === "BURROW_AMBUSH") {
        // 【招式 3：地底鑽潛追蹤破土】
        b.subPhase = "DIVE";
        b.timer = 95;
        b.ambushX = characterX;
      } else if (b.state === "ARC_LEAP") {
        // 【招式 4：巨蟲天際飛撲＋落地沙浪】
        b.dir = (characterX < b.headX) ? -1 : 1;
        b.arcStartX = b.headX;
        b.arcEndX = constrain(characterX + b.dir * 80, b.arenaLeft + 100, b.arenaRight - 100);
        b.arcProgress = 0;
        b.timer = 85;
      } else if (b.nextAttack === "HYPER_BEAM") {
        // 【招式 5：中左 / 中右全場擴展光束（持續 3 秒 = 180 幀，需蹲下躲避）】
        let arenaMidX = (b.arenaLeft + b.arenaRight) / 2;
        let onRightSide = (characterX < arenaMidX);
        b.dir = onRightSide ? -1 : 1; // 在中右就往左射，在中左就往右射
        b.headX = onRightSide ? (arenaMidX + 260) : (arenaMidX - 260);
        b.headY = 8.5 * TILE_SIZE;
        b.beamMaxTimer = 180; // 3 秒（60fps * 3）
        b.timer = 180;
      }
    }
  } else if (b.state === "ROCKFALL") {
    b.headY = lerp(b.headY, 9 * TILE_SIZE, 0.08);
    if (b.timer <= 0) {
      b.state = "WEAK_EXPOSE";
      b.timer = 95;
    }
  } else if (b.state === "TRAIN_CHARGE") {
    b.headX += b.vx;
    if ((b.vx > 0 && b.headX >= b.arenaRight - 50) || (b.vx < 0 && b.headX <= b.arenaLeft + 50)) {
      if (b.chargeBounces > 0) {
        b.chargeBounces--;
        b.vx *= -1;
        b.dir *= -1;
        playSFX("brick");
      } else {
        b.state = "WEAK_EXPOSE";
        b.timer = 95;
      }
    }
    if (b.timer <= 0) {
      b.state = "WEAK_EXPOSE";
      b.timer = 95;
    }
  } else if (b.state === "BURROW_AMBUSH") {
    if (b.subPhase === "DIVE") {
      b.headY = lerp(b.headY, undergroundY, 0.16);
      // 地面沙塵追蹤玩家位置
      b.ambushX = lerp(b.ambushX, characterX, 0.09);
      b.ambushX = constrain(b.ambushX, b.arenaLeft + 80, b.arenaRight - 80);
      if (b.timer <= 42) {
        b.subPhase = "ERUPT";
        b.headX = b.ambushX;
        b.vy = -21;
        playSFX("brick");
      }
    } else {
      b.vy += 0.65;
      b.headY += b.vy;
      if (b.vy > 0 && b.headY >= floorY) {
        b.headY = floorY;
        b.vy = 0;
        b.state = "WEAK_EXPOSE";
        b.timer = 95;
      }
    }
  } else if (b.state === "ARC_LEAP") {
    b.arcProgress = min(1, b.arcProgress + 0.017);
    b.headX = lerp(b.arcStartX, b.arcEndX, b.arcProgress);
    b.headY = floorY - sin(b.arcProgress * PI) * 320;
    if (b.arcProgress >= 1) {
      b.headY = floorY;
      playSFX("brick");
      // 落地向左右兩側噴出沙浪衝擊波！
      wormShockwaves.push({ x: b.headX - 30, y: 12.6 * TILE_SIZE, vx: -7.5, life: 95 });
      wormShockwaves.push({ x: b.headX + 30, y: 12.6 * TILE_SIZE, vx: 7.5, life: 95 });
      b.state = "WEAK_EXPOSE";
      b.timer = 95;
    }
  } else if (b.state === "HYPER_BEAM") {
      // 固定在中左/中右穩定蓄力與擴展，不再亂角度插自己腳
      b.headY = lerp(b.headY, 8.5 * TILE_SIZE, 0.15);
      let elapsed = (b.beamMaxTimer || 180) - b.timer; // 0 -> 180
      // 前 30 幀：小小一條預警光線；30 幀後：一路擴大成覆蓋全場的光（持續到 180 幀結束）
      let expandProg = constrain((elapsed - 30) / 75, 0, 1);
      let beamHalfH = lerp(6, 260, expandProg);

      if (expandProg > 0.08 && gameState === "PLAYING" && invincibleTimer <= 0 && starTimer <= 0) {
        let inBeamX = (b.dir === 1)
          ? (characterX >= b.headX - 10 && characterX <= b.arenaRight + 40)
          : (characterX <= b.headX + 10 && characterX >= b.arenaLeft - 40);
        let inBeamY = abs(characterY - b.headY) < beamHalfH;
        // 只有蹲下（isCrouching）才能躲過全場擴展光束
        if (inBeamX && inBeamY && !isCrouching) {
          takeDamage();
          return;
        }
      }
      if (b.timer <= 0) {
        b.state = "WEAK_EXPOSE";
        b.timer = 95;
      }
  } else if (b.state === "WEAK_EXPOSE") {
    // 只有大招結束後的 1.5 秒喘息期，巨蟲才會趴低把發光尾核露在地面高度給玩家踩！
    b.headY = lerp(b.headY, floorY, 0.14);
    if (b.timer <= 0) {
      b.state = "IDLE";
      b.timer = 45;
    }
  } else if (b.state === "COUNTER_SHOCK") {
    // 【被踩中後的震波反制狀態】：原地猛烈甩尾把玩家震走，隨後立刻恢復警戒
    b.headX += sin(frameCount * 1.1) * 7;
    b.headY = lerp(b.headY, 8 * TILE_SIZE, 0.15);
    if (b.timer <= 0) {
      b.state = "IDLE";
      b.timer = 20;
    }
  }

  // === 更新 16 節巨型身體（非喘息期時，後半段自動蜷縮抬高或沉沙保護弱點） ===
  if (b.segments.length < 16) {
    while (b.segments.length < 16) {
      b.segments.push({ x: b.headX, y: b.headY });
    }
  }
  b.segments[0].x = b.headX;
  b.segments[0].y = b.headY;

  let isTailVulnerable = (b.state === "WEAK_EXPOSE");
    let waveAmp = (b.state === "TRAIN_CHARGE") ? 14 : ((b.state === "COUNTER_SHOCK") ? 18 : 9);
    let waveSpeed = (b.state === "TRAIN_CHARGE") ? 0.28 : 0.16;

    for (let i = 1; i < b.segments.length; i++) {
      let prev = b.segments[i - 1];
      let cur = b.segments[i];
      let dx = prev.x - cur.x;
      let dy = prev.y - cur.y;
      let d = max(0.001, sqrt(dx * dx + dy * dy));
      let nx = dx / d;
      let ny = dy / d;
      // 垂直於連線方向的法向量，用來做蛇形軟Q扭動
      let perpX = -ny;
      let perpY = nx;
      let flexRatio = map(i, 1, b.segments.length - 1, 0.55, 1.35);
      let wave = sin(frameCount * waveSpeed - i * 0.55) * waveAmp * flexRatio;

      let spacing = 31;
      let targetX = prev.x - nx * spacing + perpX * wave;
      let targetY = prev.y - ny * spacing + perpY * wave;

      // 非喘息期時，尾巴往上翹起（用柔和的目標高度，不把後面幾節卡死）
      if (!isTailVulnerable && b.state !== "BURROW_AMBUSH" && i >= 10) {
        let lift = (i - 9) * 10;
        targetY -= lift;
      }

      // 軟Q彈性追隨（越往後越有甩鞭感）
      let spring = map(i, 1, b.segments.length - 1, 0.42, 0.28);
      cur.x = lerp(cur.x, targetX, spring);
      cur.y = lerp(cur.y, targetY, spring);
    }

  // 鑽潛階段時整條蟲身沉入沙底
  if (b.state === "BURROW_AMBUSH" && b.subPhase === "DIVE") {
    for (let seg of b.segments) {
      seg.y = lerp(seg.y, undergroundY, 0.2);
    }
  }

  let tail = b.segments[b.segments.length - 1];

  // 統一傷害與「受擊震波彈開反制」邏輯
  const damageSandworm = (dmg, hitX, hitY, triggerRepel = false) => {
    b.hp -= dmg;
    b.hurtFlash = 10;
    score += 300 * dmg;
    playSFX("kick");
    floatingTexts.push({ text: `-${dmg * 10} 弱點重擊！`, x: hitX - 35, y: hitY - 30, vy: -1.5, life: 55 });

    if (b.hp <= 0) {
      b.hp = 0;
      b.state = "DEFEATED";
      b.active = false;
      b.doorLocked = false;
      b.doorOpened = true;
      wormRocks = [];
      wormShockwaves = [];
      score += 25000;
      playSFX("clear");
      floatingTexts.push({ text: "沙暴巨蟲擊破！神殿大門已開啟！", x: characterX - 95, y: characterY - 70, vy: -1.2, life: 140, isOneUp: true });
      return;
    }

    // 只要被玩家近身踩踏或衝刺撞中，巨蟲立刻釋放高壓沙暴震波把玩家強行彈飛，絕不給連踩！
    if (triggerRepel) {
      let pushDir = (characterX < hitX) ? -1 : 1;
      knockbackVX = pushDir * 15.5;
      velocityY = -13.5;
      invincibleTimer = max(invincibleTimer, 600);
      b.state = "COUNTER_SHOCK";
      b.timer = 32;
      b.shockRingR = 20;
      playSFX("brick");
      floatingTexts.push({ text: "💥 沙暴震波反制！", x: hitX - 45, y: hitY - 55, vy: -1.6, life: 55 });
    }
  };

  // 火球命中尾部弱點（僅在弱點未沉入地底時有效）
  for (let i = playerFireballs.length - 1; i >= 0; i--) {
    let fb = playerFireballs[i];
    if (tail.y < 13.5 * TILE_SIZE && dist(fb.x, fb.y, tail.x, tail.y) < 42) {
      playerFireballs.splice(i, 1);
      damageSandworm(10, tail.x, tail.y, false);
      if (b.state === "DEFEATED") return;
    }
  }

  // 仙人掌飛針命中尾部弱點
  for (let i = cactusNeedles.length - 1; i >= 0; i--) {
    let nd = cactusNeedles[i];
    if (tail.y < 13.5 * TILE_SIZE && dist(nd.x, nd.y, tail.x, tail.y) < 42) {
      nd.life = 0;
      damageSandworm(8, tail.x, tail.y, false);
      if (b.state === "DEFEATED") return;
    }
  }

  // 玩家本體與巨蟲碰撞判定
  if (gameState === "PLAYING" && tail.y < 13.5 * TILE_SIZE) {
    // 1. 判定是否命中「發光尾部弱點」
    if (dist(characterX, characterY, tail.x, tail.y) < (playerW / 2 + 30)) {
      if (velocityY > 0 || starTimer > 0 || (powerType === "speed" && currentSprintBonus >= 0.85)) {
        damageSandworm(15, tail.x, tail.y, true); // 觸發震波彈開！
        return;
      }
    }

    // 2. 判定前面 15 節巨型帶刺裝甲身體（半徑加大至 34px）
    for (let i = 0; i < b.segments.length - 1; i++) {
      let seg = b.segments[i];
      if (seg.y > 13.5 * TILE_SIZE) continue;
      if (dist(characterX, characterY, seg.x, seg.y) < (playerW / 2 + 30)) {
        if (starTimer > 0) {
          damageSandworm(5, seg.x, seg.y, true);
          return;
        } else if (powerType === "speed" && currentSprintBonus >= 0.85) {
          let pushDir = (characterX < seg.x) ? -1 : 1;
          knockbackVX = pushDir * 10.5;
          velocityY = -7;
          currentSprintBonus = 0;
          playerStunTimer = 3000;
          playSFX("stomp");
          floatingTexts.push({ text: "撞到巨型刺甲！自暈 3 秒！", x: characterX - 65, y: characterY - 50, vy: -1.2, life: 70 });
          return;
        } else if (invincibleTimer <= 0) {
          takeDamage();
          return;
        }
      }
    }
  }
}

function drawSandwormBoss() {
  if (!sandwormBoss) return;
  let b = sandwormBoss;

  // 1. 繪製競技場左右厚重封印石門
  if (b.doorLocked) {
    fill("#5C4033");
    stroke("#2B190E");
    strokeWeight(4);
    rect(b.arenaLeft - 18, 1 * TILE_SIZE, 28, 12 * TILE_SIZE);
    rect(b.arenaRight - 10, 1 * TILE_SIZE, 28, 12 * TILE_SIZE);
  }

  // 2. 招式 1：掉落巨石與紅線預警
  for (let rk of wormRocks) {
    if (rk.warnTimer > 0) {
      stroke(255, 59, 48, 180);
      strokeWeight(2.5);
      line(rk.x, 40, rk.x, 13 * TILE_SIZE);
      noStroke();
      fill("#FF3B30");
      triangle(rk.x - 10, 54, rk.x + 10, 54, rk.x, 70);
    } else {
      fill("#7F5539");
      stroke("#3D1E16");
      strokeWeight(2.5);
      ellipse(rk.x, rk.y, rk.r * 2.1, rk.r * 1.9);
    }
  }

  // 3. 招式 3：地底鑽潛沙塵追蹤預警
  if (b.active && b.state === "BURROW_AMBUSH" && b.subPhase === "DIVE") {
    noStroke();
    fill("#E9C46A");
    let rumble = sin(frameCount * 0.8) * 6;
    ellipse(b.ambushX + rumble, 13 * TILE_SIZE, 95, 26);
    fill("#FF5400");
    triangle(b.ambushX - 14, 12.2 * TILE_SIZE, b.ambushX + 14, 12.2 * TILE_SIZE, b.ambushX, 11.4 * TILE_SIZE);
  }

  // 4. 招式 4：落地沙浪衝擊波
  for (let sw of wormShockwaves) {
    noStroke();
    fill("#F4A261");
    arc(sw.x, sw.y + 16, 44, 52, PI, TWO_PI);
    fill("#FFF3B0");
    arc(sw.x, sw.y + 16, 26, 32, PI, TWO_PI);
  }

  if (b.state === "DEFEATED") return;

  // 5. 從尾部往頭部繪製 16 節巨型沙暴巨蟲（體型大幅放大！）
  for (let i = b.segments.length - 1; i >= 0; i--) {
    let seg = b.segments[i];
    if (seg.y > 14 * TILE_SIZE) continue;
    let isTail = (i === b.segments.length - 1);
    let isHead = (i === 0);

    push();
    translate(seg.x, seg.y);
    if (isTail) {
      // 巨型發光尾部弱點（喘息期亮起強光）
      let pulse = (b.state === "WEAK_EXPOSE") ? (84 + sin(frameCount * 0.35) * 12) : 64;
      noStroke();
      fill(255, 90, 0, b.state === "WEAK_EXPOSE" ? 130 : 60);
      ellipse(0, 0, pulse, pulse);
      fill(b.hurtFlash > 0 ? "#FFFFFF" : "#FF5400");
      stroke("#FFD166");
      strokeWeight(4);
      ellipse(0, 0, 50, 50);
    } else if (!isHead) {
      // 中間 14 節巨蟲體節（i = 1 ~ 14）
      let segR = map(i, 1, 14, 62, 46);
      let prevSeg = b.segments[i - 1];
      let ang = atan2(prevSeg.y - seg.y, prevSeg.x - seg.x);
      rotate(ang);

      noStroke();
      fill(b.hurtFlash > 0 ? "#FFFFFF" : "#582F0E");
      triangle(-8, -segR * 0.42, 8, -segR * 0.42, 0, -segR * 0.88);

      fill(b.hurtFlash > 0 ? "#FFFFFF" : (i % 2 === 0 ? "#8D5524" : "#7F4F24"));
      stroke("#3D1E16");
      strokeWeight(3.5);
      ellipse(0, 0, segR * 1.18, segR * 0.94);

      noStroke();
      fill("#DDB892");
      arc(0, segR * 0.12, segR * 0.72, segR * 0.44, 0, PI);
    } else if (isHead) {
      // 無眼盲眼巨蟲：厚重角質頭殼＋四向環狀獠牙深淵口器
      fill(b.hurtFlash > 0 ? "#FFFFFF" : "#6F4518");
      stroke("#3D1E16");
      strokeWeight(4);
      ellipse(0, 0, 88, 78);

      // 額頭與側邊幾丁質骨板
      noStroke();
      fill(b.hurtFlash > 0 ? "#FFFFFF" : "#8D5524");
      arc(-b.dir * 6, 0, 74, 68, HALF_PI, PI + HALF_PI);

      // 前端張開的深淵口器（無眼盲蟲核心特徵）
      fill("#1A0505");
      stroke("#3D1E16");
      strokeWeight(3);
      ellipse(b.dir * 24, 0, 34, 52);

      // 上下與內圈環狀鋸齒獠牙
      noStroke();
      fill("#FFF8E7");
      triangle(b.dir * 18, -28, b.dir * 52, -16, b.dir * 26, -10);
      triangle(b.dir * 18, 28,  b.dir * 52, 16,  b.dir * 26, 10);
      triangle(b.dir * 24, -10, b.dir * 46, 0,   b.dir * 24, 10);
    }
    pop();
  }

  // 被踩中後的沙暴震波擴散光環特效
  if (b.state === "COUNTER_SHOCK") {
    let tail = b.segments[b.segments.length - 1];
    b.shockRingR = (b.shockRingR || 20) + 18;
    push();
    translate(tail.x, tail.y);
    noFill();
    stroke(255, 209, 102, 220);
    strokeWeight(6);
    ellipse(0, 0, b.shockRingR, b.shockRingR);
    pop();
  }

  // 招式 5：中左/中右全場擴展光束（持續 3 秒，蹲下躲避）
  if (b.state === "HYPER_BEAM") {
    let elapsed = (b.beamMaxTimer || 180) - b.timer;
    let expandProg = constrain((elapsed - 30) / 75, 0, 1);
    let beamHalfH = lerp(6, 260, expandProg);
    let beamLen = (b.dir === 1)
      ? max(120, (b.arenaRight - b.headX) + 40)
      : max(120, (b.headX - b.arenaLeft) + 40);

    push();
    translate(b.headX, b.headY);
    scale(b.dir, 1);
    noStroke();
    if (expandProg <= 0.05) {
      // 一開始小小一條光線
      fill(255, 225, 120, 210);
      rect(0, -4, beamLen, 8, 4);
      fill("#FFFFFF");
      rect(0, -1.5, beamLen, 3, 2);
    } else {
      // 擴大成覆蓋全場的光
      fill(255, 130, 0, 120 + expandProg * 55);
      rect(0, -beamHalfH, beamLen, beamHalfH * 2, 12);
      fill(255, 210, 90, 150 + expandProg * 50);
      rect(0, -beamHalfH * 0.55, beamLen, beamHalfH * 1.1, 10);
      fill(255, 250, 210, 175);
      rect(0, -beamHalfH * 0.22, beamLen, beamHalfH * 0.44, 8);
    }
    pop();
  }

  // 底部 BOSS 血條
  if (b.active) {
    push();
    resetMatrix();
    let barW = min(440, width * 0.65);
    let bx = width / 2 - barW / 2;
    let by = height - 42;
    fill(0, 0, 0, 200);
    stroke("#FFD166");
    strokeWeight(2.5);
    rect(bx - 6, by - 22, barW + 12, 34, 10);
    noStroke();
    fill("#FFD166");
    textSize(13);
    textAlign(CENTER, TOP);
    text("SANDWORM GUARDIAN（沙暴巨蟲）", width / 2, by - 19);
    fill("#333");
    rect(bx, by - 2, barW, 10, 5);
    fill("#FF5400");
    rect(bx, by - 2, barW * (b.hp / b.maxHp), 10, 5);
    pop();
  }
}

function updateRescueCutscene() {
  if (!rescueCutscene) return;
  rescueCutscene.timer++;
  if (rescueCutscene.timer === 1) playSFX("1up");
  if (rescueCutscene.timer >= 180) {
    unlockedNewChar = true;
    activeCharacterId = 1;
    rescueCutscene = null;
    floatingTexts.push({
      text: "★ 解鎖新角色「沙漠遊俠」！按 [C] 隨時切換！",
      x: characterX - 110, y: characterY - 70, vy: -1.0, life: 160, isOneUp: true
    });
    gameState = "WALK_TO_CASTLE";
    castleTargetX = sandwormBoss ? (sandwormBoss.arenaRight + 20) : (characterX + 40);
  }
}

function drawRescueCutscene() {
  if (!rescueCutscene) return;
  let cx = rescueCutscene.cageX;
  let cy = rescueCutscene.cageY;
  push();
  translate(cx, cy);
  noStroke();
  fill("#2EC4B6");
  rect(-12, -34, 24, 34, 6);
  fill("#FFD166");
  ellipse(0, -44, 24, 24);
  fill("#E63946");
  rect(-15, -52, 30, 7, 3);
  if (rescueCutscene.timer < 80) {
    stroke("#ADB5BD");
    strokeWeight(3);
    noFill();
    rect(-22, -62, 44, 62, 4);
    line(-8, -62, -8, 0);
    line(8, -62, 8, 0);
  }
  pop();

  push();
  resetMatrix();
  fill(0, 0, 0, 170);
  rect(width / 2 - 210, 88, 420, 54, 14);
  fill("#FFD166");
  textSize(18);
  textAlign(CENTER, CENTER);
  text("🎉 成功救出被囚禁的「沙漠遊俠」！", width / 2, 115);
  pop();
}

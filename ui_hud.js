// =====================================================================
// ui_hud.js — 遊戲內 HUD、角色頭像、道具圖示。
// =====================================================================

function drawColorfulWorldLogo(worldStr, x, y, size = 38) {
  const palette = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#32ADE6", "#AF52DE"];
  push();
  textFont("Arial Black, Impact, sans-serif");
  textStyle(BOLD);
  textSize(size);
  textAlign(LEFT, CENTER);

  let curX = x;
  for (let i = 0; i < worldStr.length; i++) {
    let ch = worldStr[i];
    if (ch === ' ') {
      curX += size * 0.35;
      continue;
    }
    stroke(0);
    strokeWeight(size * 0.22);
    fill(0);
    text(ch, curX + 2, y + 3);
    fill(palette[i % palette.length]);
    text(ch, curX, y);
    noStroke();
    curX += textWidth(ch) + 2;
  }
  pop();
}

function drawPlayerHeadBadge(cx, cy, radius = 20) {
  push();
  translate(cx, cy);
  stroke(0);
  strokeWeight(3);
  fill("#FFFFFF");
  ellipse(0, 0, radius * 2, radius * 2);

  if (standSpriteSheet && standSpriteSheet.width > 0) {
    let fw = standSpriteSheet.width / STAND_FRAME_COUNT;
    let fh = standSpriteSheet.height;
    let metric = spriteMetrics["stand"] || { contentHeight: fh, minY: 0 };
    let cropY = metric.minY;
    let cropH = metric.contentHeight * 0.58;
    let aspect = fw / cropH;
    let drawH = radius * 1.65;
    let drawW = drawH * aspect;
    imageMode(CENTER);
    image(standSpriteSheet, 0, 1, drawW, drawH, 0, cropY, fw, cropH);
  }
  pop();
}

function drawNSMBHUD() {
  push();
  textFont("Arial Black, sans-serif");
  textStyle(BOLD);

  let compact = (height < 460);
  let badgeR = compact ? 16 : 21;
  let hudFontSize = compact ? 18 : 24;

  // --- 左上角：角色頭像 × 命數 & 金幣圖示 × 金幣數 ---
  drawPlayerHeadBadge(36, compact ? 28 : 42, badgeR);

  stroke(0);
  strokeWeight(4);
  fill("#FFFFFF");
  textSize(hudFontSize);
  textAlign(LEFT, CENTER);
  text(`× ${lives}`, 60, compact ? 29 : 44);

  push();
  translate(36, compact ? 62 : 84);
  stroke(0);
  strokeWeight(2.5);
  fill("#FFD166");
  ellipse(0, 0, compact ? 17 : 22, compact ? 22 : 28);
  noStroke();
  fill("#FFF3B0");
  rect(-2, -6, 4, 12, 2);
  pop();

  stroke(0);
  strokeWeight(4);
  fill("#FFD166");
  textSize(hudFontSize);
  textAlign(LEFT, CENTER);
  text(`× ${nf(coinCount, 2)}`, 60, compact ? 63 : 85);

  // --- 正上方中央：備用道具箱 (按 B 或直接點擊空投) ---
  let boxSize = compact ? 46 : 58;
  let boxX = width / 2 - boxSize / 2;
  let boxY = compact ? 10 : 18;

  fill(15, 25, 45, 210);
  stroke(reservedItem ? "#FFD166" : "#FFFFFF");
  strokeWeight(3);
  rect(boxX, boxY, boxSize, boxSize, 10);
  noStroke();

  if (reservedItem) {
    drawPowerupIcon(reservedItem, width / 2, boxY + boxSize / 2 - 2, compact ? 0.9 : 1.15);
    stroke(0);
    strokeWeight(2.5);
    fill("#FFD166");
    textSize(10);
    textAlign(CENTER, BOTTOM);
    text(controlMode === "MOBILE" ? "TAP" : "[B]", width / 2, boxY + boxSize - 1);
  } else {
    fill(200);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(controlMode === "MOBILE" ? "ITEM" : "ITEM\n[B]", width / 2, boxY + boxSize / 2);
  }

  // --- 2-4 專屬：備用道具箱右邊的「獨立火把道具框 [E]」 ---
if (currentWorld === 2 && currentLevel === 4) {
  let tBoxX = boxX + boxSize + 12;
  fill(15, 25, 45, 210);
  stroke(torchCount > 0 ? "#FF9E00" : "#6C757D");
  strokeWeight(3);
  rect(tBoxX, boxY, boxSize, boxSize, 10);
  noStroke();

  push();
  translate(tBoxX + boxSize / 2, boxY + boxSize / 2 - 4);
  fill("#8D5524");
  rect(-2.5, -2, 5, 14, 2);
  fill(torchCount > 0 ? "#FF5400" : "#6C757D");
  ellipse(0, -6, 10, 14);
  if (torchCount > 0) {
    fill("#FFD166");
    ellipse(0, -5, 5, 8);
  }
  pop();

  stroke(0);
  strokeWeight(2.5);
  fill("#FFD166");
  textSize(10);
  textAlign(CENTER, BOTTOM);
  text(`${torchCount} [E]`, tBoxX + boxSize / 2, boxY + boxSize - 1);
}

  // --- 右上角：8位數分數 + 時鐘倒數 + 快捷觸控圖示按鈕 ---
  stroke(0);
  strokeWeight(4);
  fill("#FFFFFF");
  textSize(compact ? 19 : 24);
  textAlign(RIGHT, CENTER);
  text(nf(score, 8), width - 20, compact ? 24 : 34);

  let timerTextX = width - 20;
  let timerY = compact ? 48 : 66;
  stroke(0);
  strokeWeight(4);
  fill(levelTimer <= 60 ? "#FF3B30" : "#FFD166");
  textSize(compact ? 18 : 22);
  text(nf(levelTimer, 3), timerTextX, timerY);

  push();
  translate(timerTextX - (compact ? 52 : 64), timerY - 1);
  stroke(0);
  strokeWeight(2.5);
  fill("#FFD166");
  ellipse(0, 0, compact ? 16 : 20, compact ? 16 : 20);
  line(0, 0, 0, -4);
  line(0, 0, 4, 0);
  pop();

  // 右上角可點擊小按鈕：[⚙ 設定] / [🗺 地圖]
  let btnY = compact ? 66 : 92;
  let pillH = 26;
  noStroke();
  fill(0, 0, 0, 165);
  rect(width - 166, btnY, 70, pillH, 13);
  rect(width - 90,  btnY, 70, pillH, 13);

  fill(255);
  textFont("sans-serif");
  textSize(12);
  textAlign(CENTER, CENTER);
  text("⚙ 設定", width - 131, btnY + pillH / 2);
  text("🗺 地圖", width - 55, btnY + pillH / 2);

  // 電腦版底部提示膠囊
  if (controlMode === "PC") {
    let stageLabel = is1_2Intro ? "1-2 ENTRANCE" : `${currentWorld}-${currentLevel}`;
    let powerShort = "NORMAL";
    if (powerLevel === 2) powerShort = "SUPER";
    if (powerLevel === 3) {
      let pNames = { fire: "FIRE FLOWER", feather: "FEATHER CAPE", speed: "SPEED BOOST [Ctrl]" };
      powerShort = pNames[powerType] || "SUPER";
    }
    if (starTimer > 0) powerShort += ` ★${(starTimer / 1000).toFixed(1)}s`;

    noStroke();
    fill(0, 0, 0, 120);
    rect(18, height - 38, 520, 26, 13);
    fill(255, 255, 255, 220);
    textStyle(NORMAL);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(`WORLD ${stageLabel}  |  ${powerShort}  |  [M] 大地圖  [O] 設定`, 30, height - 25);
  }

  pop();
}

function drawPowerupIcon(type, mx, my, scaleFactor = 1.0) {
  push();
  translate(mx, my);
  scale(scaleFactor);
  noStroke();

  if (type === "mushroom") {
    fill("#FFE4B5");
    rect(-8, 0, 16, 14, 3);
    fill("#E63946");
    arc(0, 2, 32, 28, PI, TWO_PI);
    fill(255);
    ellipse(-7, -5, 6, 6);
    ellipse(7, -5, 6, 6);
    ellipse(0, -9, 7, 7);
  } else if (type === "fire") {
    fill("#2EC4B6");
    rect(-2, 2, 4, 14);
    ellipse(-7, 8, 10, 5);
    ellipse(7, 8, 10, 5);
    fill("#FF2A00");
    ellipse(0, -4, 26, 18);
    fill("#FF9E00");
    ellipse(0, -4, 18, 12);
    fill("#FFF3B0");
    ellipse(0, -4, 9, 6);
  } else if (type === "feather") {
    fill("#FFD166");
    stroke("#E09F3E");
    strokeWeight(1.5);
    ellipse(0, -2, 16, 28);
    noStroke();
    fill("#FFF3B0");
    rect(-1.5, -14, 3, 28);
  } else if (type === "speed") {
    fill("#FFE4B5");
    rect(-8, 0, 16, 14, 3);
    fill("#0096C7");
    arc(0, 2, 32, 28, PI, TWO_PI);
    fill("#FFD166");
    triangle(-2, -13, 5, -5, -1, -5);
    triangle(2, 1, -5, -7, 1, -7);
    } else if (type === "cactus") {
    fill("#FFE4B5");
    rect(-8, 0, 16, 14, 3);
    fill("#2D6A4F");
    arc(0, 2, 32, 28, PI, TWO_PI);
    fill("#FFD166");
    triangle(-10, -4, -15, -8, -8, -8);
    triangle(10, -4, 15, -8, 8, -8);
    triangle(0, -11, -3, -17, 3, -17);
  } else if (type === "chrono") {
    fill("#FFE4B5");
    rect(-8, 0, 16, 14, 3);
    fill("#D97706");
    arc(0, 2, 32, 28, PI, TWO_PI);
    fill("#FFF3B0");
    triangle(-5, -9, 5, -9, 0, -4);
    triangle(-5, 0, 5, 0, 0, -4);
  } else if (type === "star") {
    fill(frameCount % 6 < 3 ? "#FFD700" : "#FFF3B0");
    stroke("#E09F3E");
    strokeWeight(1.5);
    beginShape();
    for (let i = 0; i < 10; i++) {
      let r = (i % 2 === 0) ? 15 : 6;
      let a = -HALF_PI + i * PI / 5;
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE);
    noStroke();
    fill(0);
    rect(-3, -3, 2, 5);
    rect(2, -3, 2, 5);
  }
  pop();
}
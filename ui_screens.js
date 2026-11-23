// =====================================================================
// ui_screens.js — 全螢幕畫面：裝置選擇、關卡開場、Game Over。
// =====================================================================

// =====================================================================
// 0. 開頭裝置配置選擇畫面 (Device Select Screen) - 支援手機橫螢幕自適應排版
// =====================================================================
function getDeviceSelectCards() {
  let compact = (height < 430);
  let cardW = min(310, width * 0.42);
  let cardH = compact ? constrain(height * 0.44, 148, 185) : min(215, height * 0.42);
  let gap = min(36, width * 0.045);
  let centerY = compact ? height * 0.50 : height * 0.50;
  return [
    {
      mode: "PC",
      x: width / 2 - cardW / 2 - gap / 2,
      y: centerY,
      w: cardW,
      h: cardH,
      title: "電腦版 (PC)",
      sub: "鍵盤操作模式",
      desc: "方向鍵 / WASD 移動｜空白鍵 / W 跳躍\nF 射擊｜Ctrl 加速｜B 空投｜O 設定",
      accent: "#32ADE6"
    },
    {
      mode: "MOBILE",
      x: width / 2 + cardW / 2 + gap / 2,
      y: centerY,
      w: cardW,
      h: cardH,
      title: "手機 / 平板版",
      sub: "自動適應視角＋虛擬按鍵",
      desc: "自動完整縮放 15 格高度\nDASH 點按鎖定｜支援多點觸控",
      accent: "#34C759"
    }
  ];
}

function getDeviceGuideToggleRect() {
  let compact = (height < 430);
  let barW = min(420, width * 0.86);
  let barH = compact ? 36 : 44;
  return {
    x: width / 2 - barW / 2,
    y: compact ? height * 0.80 : height * 0.77,
    w: barW,
    h: barH
  };
}

function drawDeviceSelect() {
  let compact = (height < 430);
  background("#1A2639");
  noStroke();
  fill("#24344D");
  ellipse(width * 0.2, height * 0.85, width * 0.6, height * 0.5);
  ellipse(width * 0.8, height * 0.85, width * 0.6, height * 0.5);

  let logoSize = compact ? min(28, width * 0.042) : min(42, width * 0.055);
  drawColorfulWorldLogo("SUPER PLATFORMER", width / 2 - logoSize * 5.6, compact ? height * 0.11 : height * 0.15, logoSize);

  fill("#FFD166");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(compact ? min(14, width * 0.024) : min(20, width * 0.030));
  textAlign(CENTER, CENTER);
  text("請選擇你的遊玩裝置配置（遊戲中可隨時在右上角「⚙設定」調整）", width / 2, compact ? height * 0.20 : height * 0.24);

  let cards = getDeviceSelectCards();
  for (let c of cards) {
    let isHover = (mouseX > c.x - c.w / 2 && mouseX < c.x + c.w / 2 &&
                   mouseY > c.y - c.h / 2 && mouseY < c.y + c.h / 2);

    push();
    translate(c.x, c.y);
    stroke(isHover ? "#FFD166" : c.accent);
    strokeWeight(isHover ? 5 : 3.5);
    fill(isHover ? "#2E4365" : "#1F2E46");
    rect(-c.w / 2, -c.h / 2, c.w, c.h, 20);

    noStroke();
    let iconScale = compact ? 0.76 : 1.0;
    push();
    translate(0, -c.h * 0.25);
    scale(iconScale);
    if (c.mode === "PC") {
      fill("#E0E1DD");
      rect(-34, -22, 68, 42, 6);
      fill("#32ADE6");
      rect(-28, -17, 56, 30, 3);
      fill("#ADB5BD");
      rect(-12, 20, 24, 8);
      rect(-24, 28, 48, 5, 2);
    } else {
      fill("#E0E1DD");
      rect(-22, -28, 44, 62, 8);
      fill("#34C759");
      rect(-17, -21, 34, 46, 3);
      fill("#1F2E46");
      ellipse(0, 29, 5, 5);
    }
    pop();

    fill("#FFFFFF");
    textSize(min(compact ? 18 : 23, c.w * 0.085));
    textAlign(CENTER, CENTER);
    text(c.title, 0, c.h * 0.03);

    fill(c.accent);
    textSize(min(compact ? 12 : 14, c.w * 0.055));
    text(c.sub, 0, c.h * 0.16);

    fill("#CBD5E1");
    textStyle(NORMAL);
    textSize(min(compact ? 11 : 12.5, c.w * 0.044));
    text(c.desc, 0, c.h * 0.33);
    pop();
  }

  // 下方：新手道具提示 ON / OFF 滑動切換條
  let tb = getDeviceGuideToggleRect();
  push();
  stroke("#475569");
  strokeWeight(2.5);
  fill("#1F2E46");
  rect(tb.x, tb.y, tb.w, tb.h, 22);

  noStroke();
  fill("#FFF8E7");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(min(compact ? 13 : 15, tb.w * 0.038));
  textAlign(LEFT, CENTER);
  text("📖 新手道具圖鑑提示", tb.x + 18, tb.y + tb.h / 2);

  let pillW = compact ? 68 : 76;
  let pillH = compact ? 24 : 28;
  let pillX = tb.x + tb.w - pillW - 12;
  let pillY = tb.y + (tb.h - pillH) / 2;

  fill(showItemGuides ? "#34C759" : "#64748B");
  rect(pillX, pillY, pillW, pillH, 14);

  fill("#FFFFFF");
  textSize(11.5);
  textAlign(CENTER, CENTER);
  if (showItemGuides) {
    text("ON", pillX + pillW * 0.32, pillY + pillH / 2);
    ellipse(pillX + pillW - pillH / 2, pillY + pillH / 2, pillH - 6, pillH - 6);
  } else {
    text("OFF", pillX + pillW * 0.68, pillY + pillH / 2);
    ellipse(pillX + pillH / 2, pillY + pillH / 2, pillH - 6, pillH - 6);
  }
  pop();
}

function drawLevelIntro() {
  background(0);

  drawColorfulWorldLogo(`World ${currentWorld} - ${currentLevel}`, width / 2 - 125, height / 2 - 48, 44);

  drawPlayerHeadBadge(width / 2 - 45, height / 2 + 32, 24);
  stroke(255);
  strokeWeight(1);
  fill("#FFFFFF");
  textFont("Arial Black, sans-serif");
  textSize(28);
  textAlign(LEFT, CENTER);
  text(`× ${lives}`, width / 2 - 8, height / 2 + 34);

  if (millis() - stateTimer > 1500) {
    gameState = "PLAYING";
    lastLevelTimerTick = millis();
  }
}

function drawGameOver() {
  background("#0d0d14");
  textAlign(CENTER, CENTER);
  fill("#E63946");
  textSize(min(56, width * 0.08));
  text("GAME OVER", width / 2, height / 2 - 50);
  fill(255);
  textSize(min(24, width * 0.04));
  text(`FINAL SCORE: ${score}`, width / 2, height / 2 + 15);
  textSize(min(20, width * 0.032));
  fill("#FFD700");
  text(controlMode === "MOBILE" ? "點擊螢幕重新挑戰（恢復 3 條命）" : "按 [R] 重新挑戰（恢復 3 條命）或按 [M] 返回大地圖選單", width / 2, height / 2 + 65);
}

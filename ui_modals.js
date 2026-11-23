// =====================================================================
// ui_modals.js — 彈窗：道具圖鑑、設定、離開確認、沙漠補給屋。
// =====================================================================

// 沙漠補給屋彈窗狀態
let showShopModal = false;

let shopItems = []; // 存放 [3階道具A, 3階道具B, "1up"]

// 首次獲得道具圖鑑說明系統
let seenPowerups = {};

let activeGuideData = null;

let guideOpenTime = 0;

function triggerFirstTimeItemGuide(type) {
  if (!showItemGuides) return false;
  if (!POWERUP_GUIDE_DB[type]) return false;
  if (!seenPowerups[type]) {
    seenPowerups[type] = true;
    activeGuideData = { type: type, ...POWERUP_GUIDE_DB[type] };
    guideOpenTime = millis();
    gameState = "ITEM_GUIDE";
    return true;
  }
  return false;
}

// =====================================================================
// 首次獲得道具圖鑑說明彈窗 (Item Guide Modal) - 自動依文字行數撐高外框
// =====================================================================
function drawItemGuideModal() {
  push();
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);

  let boxW = min(520, width * 0.90);
  let textAreaW = boxW - 128;
  let fontSize = constrain(boxW * 0.031, 13, 15.5);
  let lineH = fontSize * 1.48;

  textFont("sans-serif");
  textStyle(BOLD);
  textSize(fontSize);

  // 1. 先依實際文字寬度計算每段說明會折成幾行，動態決定彈窗總高度
  let wrappedParagraphs = [];
  let totalLines = 0;
  for (let rawLine of activeGuideData.desc) {
    let lines = [];
    let cur = "";
    for (let ch of rawLine) {
      if (textWidth(cur + ch) > textAreaW && cur.length > 0) {
        lines.push(cur);
        cur = ch;
      } else {
        cur += ch;
      }
    }
    if (cur.length > 0) lines.push(cur);
    wrappedParagraphs.push(lines);
    totalLines += lines.length;
  }

  let contentH = totalLines * lineH + (wrappedParagraphs.length - 1) * 6;
  let boxH = max(230, min(height * 0.88, 118 + contentH));
  let bx = width / 2 - boxW / 2;
  let by = height / 2 - boxH / 2;

  // 深胡桃木咖啡色底板
  stroke("#8D5524");
  strokeWeight(6);
  fill("#3B2414");
  rect(bx, by, boxW, boxH, 18);

  stroke("#D4A373");
  strokeWeight(2.5);
  noFill();
  rect(bx + 8, by + 8, boxW - 16, boxH - 16, 12);

  // 頂部標題橫幅
  noStroke();
  fill(activeGuideData.color);
  rect(bx + 20, by + 18, boxW - 40, 38, 10);

  fill("#FFFFFF");
  textSize(min(19, boxW * 0.041));
  textAlign(CENTER, CENTER);
  text(`NEW ITEM! ${activeGuideData.title}`, width / 2, by + 37);

  // 左側深木展示框（垂直置中於文字區）
  let bodyTop = by + 68;
  let bodyBottom = by + boxH - 38;
  let bodyMidY = (bodyTop + bodyBottom) / 2;
  fill("#26160C");
  rect(bx + 22, bodyMidY - 45, 74, 90, 12);
  drawPowerupIcon(activeGuideData.type, bx + 59, bodyMidY + 4, 1.75);

  // 右側逐行繪製說明文字（絕對不重疊、不超框）
  fill("#FFF8E7");
  textSize(fontSize);
  textAlign(LEFT, TOP);
  let curY = bodyTop + max(0, (bodyBottom - bodyTop - contentH) / 2);
  for (let paraLines of wrappedParagraphs) {
    for (let ln of paraLines) {
      text(ln, bx + 108, curY);
      curY += lineH;
    }
    curY += 6;
  }

  fill("#FFD166");
  textSize(13);
  textAlign(CENTER, BOTTOM);
  text("點擊畫面或按任意鍵繼續冒險 ▼", width / 2, by + boxH - 13);
  pop();
}

function getExitMapConfirmRects() {
  let boxW = min(440, width * 0.88);
  let boxH = min(220, height * 0.82);
  let bx = width / 2 - boxW / 2;
  let by = height / 2 - boxH / 2;
  let compact = (boxH < 195);
  let btnW = (boxW - 68) / 2;
  let btnH = compact ? 36 : 42;
  let btnY = by + boxH - btnH - (compact ? 14 : 22);
  return {
    boxW, boxH, bx, by, compact,
    confirmBtn: { x: bx + 24, y: btnY, w: btnW, h: btnH },
    cancelBtn:  { x: bx + 44 + btnW, y: btnY, w: btnW, h: btnH }
  };
}

function drawExitMapConfirmModal() {
  let r = getExitMapConfirmRects();
  let headerH = r.compact ? 30 : 36;
  push();
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);

  stroke("#8D5524");
  strokeWeight(6);
  fill("#3B2414");
  rect(r.bx, r.by, r.boxW, r.boxH, 18);

  stroke("#D4A373");
  strokeWeight(2.5);
  noFill();
  rect(r.bx + 8, r.by + 8, r.boxW - 16, r.boxH - 16, 12);

  noStroke();
  fill("#A44A3F");
  rect(r.bx + 20, r.by + 14, r.boxW - 40, headerH, 10);

  fill("#FFF8E7");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(min(r.compact ? 16 : 18, r.boxW * 0.042));
  textAlign(CENTER, CENTER);
  text("🪧 冒險提示告示牌", width / 2, r.by + 14 + headerH / 2);

  fill("#FFF8E7");
  textSize(min(r.compact ? 14 : 16, r.boxW * 0.036));
  textAlign(CENTER, CENTER);
  text("返回地圖將重置為進入關卡前的狀態，\n請問是否確認返回地圖？", width / 2, r.by + r.boxH * 0.49);

  stroke("#540B0E");
  strokeWeight(2.5);
  fill("#E63946");
  rect(r.confirmBtn.x, r.confirmBtn.y, r.confirmBtn.w, r.confirmBtn.h, 10);

  stroke("#1B4332");
  fill("#2EC4B6");
  rect(r.cancelBtn.x, r.cancelBtn.y, r.cancelBtn.w, r.cancelBtn.h, 10);

  noStroke();
  fill("#FFFFFF");
  textSize(min(r.compact ? 14 : 16, r.boxW * 0.036));
  text("✔ 確認返回", r.confirmBtn.x + r.confirmBtn.w / 2, r.confirmBtn.y + r.confirmBtn.h / 2);
  text("✖ 繼續冒險", r.cancelBtn.x + r.cancelBtn.w / 2, r.cancelBtn.y + r.cancelBtn.h / 2);
  pop();
}

function handleExitMapConfirmClick(px, py) {
  let r = getExitMapConfirmRects();
  const inRect = (b) => (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
  if (inRect(r.confirmBtn)) {
    showExitMapConfirmModal = false;
    exitToWorldMapRestoreEntry();
  } else if (inRect(r.cancelBtn) || !inRect({ x: r.bx, y: r.by, w: r.boxW, h: r.boxH })) {
    showExitMapConfirmModal = false;
    playSFX("mapMove");
  }
}

// =====================================================================
// 畫面視角縮放與裝置操作設定視窗 (Settings Modal) - 支援手機橫螢幕自適應高度
// =====================================================================
function getSettingsModalRects() {
  let panelW = min(440, width * 0.90);
  let panelH = min(340, height * 0.92);
  let px = width / 2 - panelW / 2;
  let py = height / 2 - panelH / 2;

  let topStart = py + panelH * 0.22;
  let availH = panelH * 0.72;
  let rowGap = availH / 4;
  let btnH = min(36, rowGap * 0.80);
  let halfW = (panelW - 84) / 2;

  return {
    panelW, panelH, px, py, btnH,
    zoomOut:   { x: px + 36, y: topStart, w: 54, h: btnH },
    zoomIn:    { x: px + panelW - 90, y: topStart, w: 54, h: btnH },
    autoFit:   { x: px + 36, y: topStart + rowGap * 1, w: panelW - 72, h: btnH * 0.92 },
    guideBtn:  { x: px + 36, y: topStart + rowGap * 2, w: panelW - 72, h: btnH * 0.95 },
    modePc:    { x: px + 36, y: topStart + rowGap * 3, w: halfW, h: btnH },
    modeMob:   { x: px + 48 + halfW, y: topStart + rowGap * 3, w: halfW, h: btnH },
    muteBtn:   { x: px + 36, y: topStart + rowGap * 4 - btnH * 0.1, w: halfW, h: btnH },
    closeBtn:  { x: px + 48 + halfW, y: topStart + rowGap * 4 - btnH * 0.1, w: halfW, h: btnH }
  };
}

function drawSettingsModal() {
  let r = getSettingsModalRects();
  let curZoom = getEffectiveViewZoom();
  let compact = (r.panelH < 300);

  push();
  fill(0, 0, 0, 175);
  noStroke();
  rect(0, 0, width, height);

  stroke("#FFD166");
  strokeWeight(4);
  fill("#1D2D44");
  rect(r.px, r.py, r.panelW, r.panelH, 18);

  noStroke();
  fill("#FFD166");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(compact ? 17 : 20);
  textAlign(CENTER, TOP);
  text("⚙ 遊戲畫面與操作設定", width / 2, r.py + (compact ? 10 : 14));

  fill("#CBD5E1");
  textSize(compact ? 11.5 : 13);
  text("調整鏡頭視角大小（可完整顯示手機橫向畫面）", width / 2, r.py + (compact ? 33 : 42));

  fill("#32ADE6");
  rect(r.zoomOut.x, r.zoomOut.y, r.zoomOut.w, r.zoomOut.h, 10);
  rect(r.zoomIn.x, r.zoomIn.y, r.zoomIn.w, r.zoomIn.h, 10);

  fill("#FFFFFF");
  textSize(compact ? 18 : 22);
  textAlign(CENTER, CENTER);
  text("－", r.zoomOut.x + r.zoomOut.w / 2, r.zoomOut.y + r.zoomOut.h / 2);
  text("＋", r.zoomIn.x + r.zoomIn.w / 2, r.zoomIn.y + r.zoomIn.h / 2);

  textSize(compact ? 15 : 17);
  text(`視角倍率：${Math.round(curZoom * 100)}%`, width / 2, r.zoomOut.y + r.zoomOut.h / 2);

  fill(autoFitMobileZoom && controlMode === "MOBILE" ? "#34C759" : "#334155");
  rect(r.autoFit.x, r.autoFit.y, r.autoFit.w, r.autoFit.h, 8);
  fill("#FFFFFF");
  textSize(min(13, r.panelW * 0.031));
  text("自動完整顯示 15 格高度（手機推薦）", r.autoFit.x + r.autoFit.w / 2, r.autoFit.y + r.autoFit.h / 2);

  fill(showItemGuides ? "#2A9D8F" : "#475569");
  rect(r.guideBtn.x, r.guideBtn.y, r.guideBtn.w, r.guideBtn.h, 8);
  fill("#FFFFFF");
  textSize(min(13, r.panelW * 0.030));
  text(showItemGuides ? "📖 新手道具提示：ON（首次獲得跳圖鑑）" : "📖 新手道具提示：OFF（不彈窗）", r.guideBtn.x + r.guideBtn.w / 2, r.guideBtn.y + r.guideBtn.h / 2);

  fill(controlMode === "PC" ? "#32ADE6" : "#334155");
  rect(r.modePc.x, r.modePc.y, r.modePc.w, r.modePc.h, 8);
  fill(controlMode === "MOBILE" ? "#34C759" : "#334155");
  rect(r.modeMob.x, r.modeMob.y, r.modeMob.w, r.modeMob.h, 8);

  fill("#FFFFFF");
  textSize(compact ? 13 : 14);
  text("💻 電腦鍵盤", r.modePc.x + r.modePc.w / 2, r.modePc.y + r.modePc.h / 2);
  text("📱 手機觸控", r.modeMob.x + r.modeMob.w / 2, r.modeMob.y + r.modeMob.h / 2);

  fill(audioMuted ? "#E63946" : "#475569");
  rect(r.muteBtn.x, r.muteBtn.y, r.muteBtn.w, r.muteBtn.h, 8);
  fill("#FFD166");
  rect(r.closeBtn.x, r.closeBtn.y, r.closeBtn.w, r.closeBtn.h, 8);

  fill("#FFFFFF");
  text(audioMuted ? "🔇 音效：靜音" : "🔊 音效：開啟", r.muteBtn.x + r.muteBtn.w / 2, r.muteBtn.y + r.muteBtn.h / 2);
  fill("#1D2D44");
  text("✔ 完成設定", r.closeBtn.x + r.closeBtn.w / 2, r.closeBtn.y + r.closeBtn.h / 2);
  pop();
}

function handleSettingsModalClick(px, py) {
  let r = getSettingsModalRects();
  const inRect = (b) => (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
  if (inRect(r.zoomOut)) {
    autoFitMobileZoom = false;
    viewZoom = constrain(round((getEffectiveViewZoom() - 0.1) * 100) / 100, 0.45, 1.35);
    playSFX("mapMove");
  } else if (inRect(r.zoomIn)) {
    autoFitMobileZoom = false;
    viewZoom = constrain(round((getEffectiveViewZoom() + 0.1) * 100) / 100, 0.45, 1.35);
    playSFX("mapMove");
  } else if (inRect(r.autoFit)) {
    autoFitMobileZoom = true;
    viewZoom = constrain(height / (15 * TILE_SIZE), 0.45, 1.35);
    playSFX("powerup");
  } else if (inRect(r.guideBtn)) {
    showItemGuides = !showItemGuides;
    playSFX("mapMove");
  } else if (inRect(r.modePc)) {
    controlMode = "PC";
    autoFitMobileZoom = false;
    viewZoom = 1.0;
    playSFX("mapMove");
  } else if (inRect(r.modeMob)) {
    controlMode = "MOBILE";
    autoFitMobileZoom = true;
    playSFX("mapMove");
  } else if (inRect(r.muteBtn)) {
    audioMuted = !audioMuted;
    if (!audioMuted) playSFX("coin");
  } else if (inRect(r.closeBtn) || !inRect({ x: r.px, y: r.py, w: r.panelW, h: r.panelH })) {
    showSettingsModal = false;
    playSFX("mapMove");
  }
}

// =====================================================================
// 沙漠補給屋系統（兩個不重複 3 階道具 ＋ 中間新增 1UP 蘑菇，出門即打烊）
// =====================================================================
function openDesertShop() {
  if (!mapNodesData["2-SHOP"].isOpen) {
    playSFX("stomp");
    return;
  }
  // 隨機抽出 2 個不重複的 3 階道具（含沙漠新菇種）
  let tier3Pool = ["fire", "feather", "speed", "cactus", "chrono"];
  let idx1 = floor(random(tier3Pool.length));
  let item1 = tier3Pool.splice(idx1, 1)[0];
  let idx2 = floor(random(tier3Pool.length));
  let item2 = tier3Pool[idx2];

  // 左：3階道具A、中：1UP蘑菇、右：3階道具B
  shopItems = [item1, "1up", item2];
  showShopModal = true;
  playSFX("powerup");
}

function drawDesertShopModal() {
  push();
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);

  let boxW = min(520, width * 0.90);
  let boxH = min(290, height * 0.88);
  let bx = width / 2 - boxW / 2;
  let by = height / 2 - boxH / 2;
  let compact = (boxH < 265);

  stroke("#E63946");
  strokeWeight(6);
  fill("#FFF8E7");
  rect(bx, by, boxW, boxH, 20);

  let headerH = compact ? 32 : 40;
  noStroke();
  fill("#E63946");
  rect(bx + 18, by + 12, boxW - 36, headerH, 12);

  fill("#FFFFFF");
  textFont("sans-serif");
  textStyle(BOLD);
  textSize(min(compact ? 16 : 20, boxW * 0.041));
  textAlign(CENTER, CENTER);
  text("⛺ 沙漠綠洲補給屋（免費選領 1 項）", width / 2, by + 12 + headerH / 2);

  fill("#582F0E");
  textSize(compact ? 11.5 : 13);
  text("領取後帳篷將會打烊，通過任意關卡後再次營業！", width / 2, by + headerH + (compact ? 24 : 32));

  let slotW = (boxW - 72) / 3;
  let slotY = by + headerH + (compact ? 38 : 55);
  let slotH = max(84, boxH - (headerH + (compact ? 68 : 95)));

  const itemLabels = {
    fire: "火焰花",
    feather: "羽翼披風",
    speed: "疾風加速菇",
    cactus: "仙人掌刺甲菇",
    chrono: "時光沙漏菇",
    "1up": "1UP 綠蘑菇"
  };

  for (let i = 0; i < 3; i++) {
    let sx = bx + 20 + i * (slotW + 16);
    let type = shopItems[i];
    let iconY = slotY + slotH * 0.40;
    let iconScale = compact ? 1.05 : 1.3;

    stroke(type === "1up" ? "#38B000" : "#D4A373");
    strokeWeight(3);
    fill("#26160C");
    rect(sx, slotY, slotW, slotH, 14);

    if (type === "1up") {
      push();
      translate(sx + slotW / 2, iconY);
      scale(iconScale);
      noStroke();
      fill("#FFE4B5");
      rect(-8, 0, 16, 14, 3);
      fill("#38B000");
      arc(0, 2, 32, 28, PI, TWO_PI);
      fill(255);
      ellipse(-7, -5, 6, 6);
      ellipse(7, -5, 6, 6);
      ellipse(0, -9, 7, 7);
      pop();
    } else {
      drawPowerupIcon(type, sx + slotW / 2, iconY, iconScale);
    }

    noStroke();
    fill("#FFD166");
    textSize(min(13, slotW * 0.11));
    textAlign(CENTER, CENTER);
    text(itemLabels[type] || type, sx + slotW / 2, slotY + slotH * 0.80);
  }

  fill("#7F4F24");
  textSize(compact ? 11.5 : 13);
  textAlign(CENTER, BOTTOM);
  text("點擊上方任一補給品領取（或點擊視窗外直接離開）", width / 2, by + boxH - 10);
  pop();
}

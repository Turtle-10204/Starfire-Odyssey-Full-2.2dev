// =====================================================================
// ui_worldmap.js — 大地圖：節點資料、繪製、游標移動、進入關卡。
// =====================================================================

// World Map 大地圖選關與多世界架構
let currentWorld = 1;          // 1 = 草原世界, 2 = 沙漠世界

let selectedMapNode = "1-1";   // 改用字串 ID（如 "1-1", "2-0", "2-SHOP", "2-1"）

let mapAvatarX = 0;

let mapAvatarY = 0;

let showMapItemDrawer = false;

let clearedLevels = [false, false, false, false, false]; // 保留相容性

// 1-4 通關前往 World 2 的過場動畫狀態
let worldTransition = {
  active: false,
  phase: "NONE",   // "WHITE_FLAG" -> "EXTEND_ROAD" -> "WALK_EDGE" -> "EXPAND_W2"
  dir: 1,          // 1 = 往右去 World 2, -1 = 往左回 World 1
  timer: 0,
  flagProgress: 0,
  roadProgress: 0,
  spotlightR: 9999
};

// 全關卡節點資料庫（漸進解鎖＋雙終點分支）
// 全關卡節點資料庫（支援上下左右道路連線＋雙世界往返）
let mapNodesData = {
  // === World 1 ===
  "1-1": { id: "1-1", world: 1, label: "1-1", title: "草原起點",   type: "stage",  unlocked: true,  cleared: false, nextNormal: ["1-2"], neighbors: { right: "1-2" } },
  "1-2": { id: "1-2", world: 1, label: "1-2", title: "地下洞穴",   type: "stage",  unlocked: false, cleared: false, nextNormal: ["1-3"], neighbors: { left: "1-1", right: "1-3" } },
  "1-3": { id: "1-3", world: 1, label: "1-3", title: "黃昏浮島",   type: "stage",  unlocked: false, cleared: false, nextNormal: ["1-4"], neighbors: { left: "1-2", right: "1-4" } },
  "1-4": { id: "1-4", world: 1, label: "1-4", title: "熔岩魔王城", type: "castle", unlocked: false, cleared: false, nextNormal: ["WORLD2_INTRO"], neighbors: { left: "1-3", right: "TO_W2" } },

  // === World 2 沙漠大關（2-4 隱藏礦坑未解鎖前隱藏路線，Boss 房顯示為 2-4；解鎖後長出路線並把 Boss 改名為 2-5） ===
  "2-0":    { id: "2-0",    world: 2, label: "岔路",   title: "沙漠綠洲岔路", type: "junction", unlocked: true,  cleared: true, neighbors: { left: "TO_W1", up: "2-SHOP", right: "2-1", down: "2-1" } },
  "2-SHOP": { id: "2-SHOP", world: 2, label: "補給屋", title: "奇諾比奧帳篷", type: "shop",     unlocked: true,  cleared: false, isOpen: true, neighbors: { left: "2-0", down: "2-0" } },
  "2-1":    { id: "2-1",    world: 2, label: "2-1",    title: "黃沙綠洲",     type: "stage",    unlocked: true,  cleared: false, nextNormal: ["2-2"], nextSecret: ["2-4"], neighbors: { left: "2-0", up: "2-4", down: "2-2", right: "2-2" } },
  "2-2":    { id: "2-2",    world: 2, label: "2-2",    title: "無盡流沙海",   type: "stage",    unlocked: false, cleared: false, nextNormal: ["2-3"], neighbors: { left: "2-1", up: "2-1", right: "2-3" } },
  "2-3":    { id: "2-3",    world: 2, label: "2-3",    title: "太陽神殿",     type: "stage",    unlocked: false, cleared: false, nextNormal: ["2-5"], neighbors: { left: "2-2", up: "2-5", right: "2-5" } },
  "2-4":    { id: "2-4",    world: 2, label: "2-4",    title: "幽暗古礦坑",   type: "stage",    unlocked: false, cleared: false, nextNormal: ["2-5"], neighbors: { left: "2-1", down: "2-1", right: "2-5" } },
  "2-5":    { id: "2-5",    world: 2, label: "2-4",    title: "沙暴巨蟲巢穴", type: "castle",   unlocked: false, cleared: false, neighbors: { left: "2-3", down: "2-3" } }
};

function getWorldMapNodes() {
  let yBase = height * 0.52;
  if (currentWorld === 1) {
    return [
      { ...mapNodesData["1-1"], x: width * 0.20, y: yBase + 35 },
      { ...mapNodesData["1-2"], x: width * 0.38, y: yBase - 35 },
      { ...mapNodesData["1-3"], x: width * 0.56, y: yBase + 25 },
      { ...mapNodesData["1-4"], x: width * 0.74, y: yBase - 30 }
    ];
  } else {
    // World 2 沙漠大地圖座標（岔路口往右上進補給屋、往右下進 2-1，2-1 分支 2-2->2-3 與 2-4 匯聚到 2-5）
    return [
      { ...mapNodesData["2-0"],    x: width * 0.14, y: yBase + 10 },
      { ...mapNodesData["2-SHOP"], x: width * 0.26, y: yBase - 85 },
      { ...mapNodesData["2-1"],    x: width * 0.32, y: yBase + 45 },
      { ...mapNodesData["2-2"],    x: width * 0.50, y: yBase + 85 },
      { ...mapNodesData["2-3"],    x: width * 0.68, y: yBase + 85 },
      { ...mapNodesData["2-4"],    x: width * 0.56, y: yBase - 35 },
      { ...mapNodesData["2-5"],    x: width * 0.85, y: yBase + 15 }
    ];
  }
}

function drawWorldMap() {
  // === 1. 繪製世界背景 ===
  if (currentWorld === 1) {
    background("#5CC8FF");
    noStroke();
    fill(255, 255, 255, 190);
    ellipse(width * 0.18, height * 0.16, 130, 52);
    ellipse(width * 0.72, height * 0.14, 150, 56);

    fill("#70E000");
    ellipse(width * 0.25, height * 0.78, width * 0.75, height * 0.75);
    fill("#55C200");
    ellipse(width * 0.78, height * 0.80, width * 0.72, height * 0.78);
    fill("#38B000");
    rect(0, height * 0.68, width, height * 0.32);
  } else {
    // World 2 沙漠主題背景（金黃沙丘＋金字塔＋綠洲）
    background("#F4A261");
    noStroke();
    // 烈日
    fill("#FFF3B0");
    ellipse(width * 0.82, height * 0.16, 75, 75);

    // 遠景金字塔
    fill("#E76F51");
    triangle(width * 0.42, height * 0.42, width * 0.54, height * 0.18, width * 0.66, height * 0.42);
    fill("#D65A31");
    triangle(width * 0.54, height * 0.18, width * 0.66, height * 0.42, width * 0.58, height * 0.42);

    // 沙漠沙丘地形
    fill("#E9C46A");
    ellipse(width * 0.25, height * 0.75, width * 0.85, height * 0.80);
    fill("#F4D58D");
    ellipse(width * 0.75, height * 0.78, width * 0.85, height * 0.80);
    rect(0, height * 0.65, width, height * 0.35);

    // 岔路口旁的綠洲水池
    fill("#2EC4B6");
    ellipse(width * 0.12, height * 0.68, 95, 36);
  }

  let nodes = getWorldMapNodes();
  let nodeById = {};
  for (let n of nodes) nodeById[n.id] = n;

  // === 2. 繪製道路連線（未解鎖路線呈暗灰色） ===
  const drawRoadSegment = (a, b, isUnlocked) => {
    if (!a || !b) return;
    stroke(isUnlocked ? "#C9963B" : "#6C757D");
    strokeWeight(16);
    line(a.x, a.y, b.x, b.y);
    stroke(isUnlocked ? "#F4D58D" : "#ADB5BD");
    strokeWeight(10);
    line(a.x, a.y, b.x, b.y);
  };

  if (currentWorld === 1) {
    drawRoadSegment(nodeById["1-1"], nodeById["1-2"], nodeById["1-2"].unlocked);
    drawRoadSegment(nodeById["1-2"], nodeById["1-3"], nodeById["1-3"].unlocked);
    drawRoadSegment(nodeById["1-3"], nodeById["1-4"], nodeById["1-4"].unlocked);

    // 1-4 通關後，右側通往 World 2 沙漠的道路（過場期間嚴格依階段顯示）
    let showW2Road = worldTransition.active
      ? (worldTransition.phase !== "WHITE_FLAG")
      : nodeById["1-4"].cleared;

    if (showW2Road) {
      let c4 = nodeById["1-4"];
      let prog = (worldTransition.active && worldTransition.phase === "EXTEND_ROAD")
        ? worldTransition.roadProgress
        : 1;
      let endX = lerp(c4.x, width + 40, prog);
      stroke("#C9963B");
      strokeWeight(16);
      line(c4.x, c4.y, endX, c4.y);
      stroke("#F4D58D");
      strokeWeight(10);
      line(c4.x, c4.y, endX, c4.y);
    }
  } else {
    // 2-0 岔路口往左延伸返回 World 1 草原的道路
    let j0 = nodeById["2-0"];
    stroke("#C9963B");
    strokeWeight(16);
    line(-40, j0.y, j0.x, j0.y);
    stroke("#F4D58D");
    strokeWeight(10);
    line(-40, j0.y, j0.x, j0.y);

    drawRoadSegment(nodeById["2-0"], nodeById["2-SHOP"], true);
    drawRoadSegment(nodeById["2-0"], nodeById["2-1"],    true);
    drawRoadSegment(nodeById["2-1"], nodeById["2-2"],    nodeById["2-2"].unlocked);
    drawRoadSegment(nodeById["2-2"], nodeById["2-3"],    nodeById["2-3"].unlocked);
    drawRoadSegment(nodeById["2-3"], nodeById["2-5"],    nodeById["2-5"].unlocked);
    // 隱藏路線 2-1 -> 2-4 -> 2-5（僅在 2-4 解鎖後才長出來，且把 Boss 關從 2-4 改名為 2-5！）
    if (mapNodesData["2-4"].unlocked) {
      mapNodesData["2-5"].label = "2-5";
      mapNodesData["2-5"].neighbors.left = "2-4";
      drawRoadSegment(nodeById["2-1"], nodeById["2-4"], true);
      drawRoadSegment(nodeById["2-4"], nodeById["2-5"], true);
    } else {
      mapNodesData["2-5"].label = "2-4";
      mapNodesData["2-5"].neighbors.left = "2-3";
    }
    
  }
  noStroke();

  // === 3. 繪製所有關卡與建築節點 ===
  for (let n of nodes) {
    let isSelected = (selectedMapNode === n.id);
    let isLocked = !n.unlocked;

    // 魔王城堡建築
    if (n.type === "castle") {
      push();
      translate(n.x, n.y - 34);
      stroke(0);
      strokeWeight(3);
      fill(isLocked ? "#6C757D" : (currentWorld === 2 ? "#D97706" : "#6C757D"));
      rect(-32, -26, 64, 48, 4);
      fill(isLocked ? "#495057" : (currentWorld === 2 ? "#B45309" : "#495057"));
      rect(-24, -44, 48, 22);
      fill(isLocked ? "#8D99AE" : "#E63946");
      triangle(-28, -44, 0, -68, 28, -44);
      fill("#1A0505");
      arc(0, 22, 24, 30, PI, TWO_PI);

      // 1-4 通關動畫：城堡頂端升起白旗！
      if (n.id === "1-4" && (n.cleared || worldTransition.active)) {
        let fp = worldTransition.active ? worldTransition.flagProgress : 1;
        let poleH = 38 * fp;
        stroke("#FFFFFF");
        strokeWeight(3);
        line(0, -68, 0, -68 - poleH);
        if (fp > 0.4) {
          noStroke();
          fill("#FFFFFF");
          triangle(0, -68 - poleH, 26, -60 - poleH, 0, -52 - poleH);
        }
      }
      pop();
    }

    // 沙漠補給屋帳篷建築
    if (n.type === "shop") {
      push();
      translate(n.x, n.y - 26);
      stroke(0);
      strokeWeight(3);
      fill(n.isOpen ? "#FFF3B0" : "#6C757D");
      rect(-22, -6, 44, 24, 4);
      fill(n.isOpen ? "#E63946" : "#495057");
      arc(0, -4, 58, 42, PI, TWO_PI);
      if (n.isOpen) {
        noStroke();
        fill("#FFFFFF");
        ellipse(-12, -13, 9, 9);
        ellipse(12, -13, 9, 9);
        ellipse(0, -18, 10, 10);
      } else {
        // 關門掛牌
        fill("#2B2D42");
        rect(-18, -2, 36, 14, 3);
        noStroke();
        fill("#FFD166");
        textSize(9);
        textAlign(CENTER, CENTER);
        text("CLOSED", 0, 5);
      }
      pop();
    }

    // 節點圓盤（未解鎖為灰色、已過關綠色、可挑戰紅色、岔路金色）
    push();
    translate(n.x, n.y);
    stroke(0);
    strokeWeight(4);
    if (isLocked) {
      fill("#6C757D"); // 未解鎖灰色
    } else if (n.type === "junction") {
      fill("#FFD166");
    } else if (n.type === "shop") {
      fill(n.isOpen ? "#32ADE6" : "#6C757D");
    } else {
      fill(n.cleared ? "#38B000" : "#E63946");
    }
    ellipse(0, 0, isSelected ? 46 : 38, isSelected ? 32 : 26);

    noStroke();
    fill(255, 255, 255, isLocked ? 60 : 160);
    ellipse(-5, -4, 14, 7);

    // 節點文字（未解鎖顯示暗灰字）
    stroke(0);
    strokeWeight(4);
    fill(isLocked ? "#ADB5BD" : "#FFFFFF");
    textFont("Arial Black, sans-serif");
    textSize(16);
    textAlign(CENTER, TOP);
    text(n.label, 0, 22);
    pop();
  }

  // === 4. 更新角色位置與 1-4 -> World 2 過場動畫狀態機 ===
  let targetNode = nodeById[selectedMapNode] || nodes[0];
  if (mapAvatarX === 0 && mapAvatarY === 0) {
    mapAvatarX = targetNode.x;
    mapAvatarY = targetNode.y;
  }

  if (worldTransition.active) {
    let elapsed = millis() - worldTransition.timer;
    if (worldTransition.phase === "WHITE_FLAG") {
      mapAvatarX = targetNode.x;
      mapAvatarY = targetNode.y;
      worldTransition.flagProgress = constrain(elapsed / 900, 0, 1);
      if (elapsed > 1000) {
        worldTransition.phase = "EXTEND_ROAD";
        worldTransition.timer = millis();
      }
    } else if (worldTransition.phase === "EXTEND_ROAD") {
      worldTransition.roadProgress = constrain(elapsed / 900, 0, 1);
      if (elapsed > 1000) {
        worldTransition.phase = "WALK_EDGE";
        worldTransition.timer = millis();
        worldTransition.spotlightR = max(width, height) * 0.75;
      }
    } else if (worldTransition.phase === "WALK_EDGE") {
      // 依 dir 往右(1)或往左(-1)走到螢幕邊緣，同時聚光燈縮緊
      mapAvatarX += 4.2 * (worldTransition.dir || 1);
      worldTransition.spotlightR = max(55, worldTransition.spotlightR - 14);

      if (worldTransition.dir === -1 && mapAvatarX < -30) {
        // 往左走回 World 1，停在 1-4
        currentWorld = 1;
        selectedMapNode = "1-4";
        let w1Nodes = getWorldMapNodes();
        let n14 = w1Nodes.find(n => n.id === "1-4");
        mapAvatarX = n14 ? n14.x : width * 0.74;
        mapAvatarY = n14 ? n14.y : height * 0.5;
        worldTransition.phase = "EXPAND_W2";
        worldTransition.spotlightR = 45;
        worldTransition.timer = millis();
      } else if (worldTransition.dir !== -1 && mapAvatarX > width + 30) {
        // 往右走進 World 2，停在 2-0
        currentWorld = 2;
        selectedMapNode = "2-0";
        let w2Nodes = getWorldMapNodes();
        mapAvatarX = w2Nodes[0].x;
        mapAvatarY = w2Nodes[0].y;
        worldTransition.phase = "EXPAND_W2";
        worldTransition.spotlightR = 45;
        worldTransition.timer = millis();
      }
    } else if (worldTransition.phase === "EXPAND_W2") {
      // 圓圈以角色為中心擴大，直到照出整個新地圖
      worldTransition.spotlightR += 18;
      if (worldTransition.spotlightR > max(width, height) * 1.2) {
        worldTransition.active = false;
        worldTransition.phase = "NONE";
      }
    }
  } else {
    mapAvatarX = lerp(mapAvatarX, targetNode.x, 0.22);
    mapAvatarY = lerp(mapAvatarY, targetNode.y, 0.22);
  }

  // 繪製大地圖角色
  if (standSpriteSheet && standSpriteSheet.width > 0) {
    let fw = standSpriteSheet.width / STAND_FRAME_COUNT;
    let fh = standSpriteSheet.height;
    let metric = spriteMetrics["stand"] || { contentHeight: fh, frameBottomPaddings: [0] };
    let targetRealH = 76;
    let s = targetRealH / metric.contentHeight;
    let bottomPad = (metric.frameBottomPaddings[0] || 0) * s;
    let bounce = abs(sin(frameCount * 0.12)) * 5;
    let drawY = mapAvatarY - (fh * s) / 2 + bottomPad - bounce;
    image(standSpriteSheet, mapAvatarX, drawY, fw * s, fh * s, 0, 0, fw, fh);
  }

  // === 5. 圓形聚光燈黑幕遮罩（僅在 WALK_EDGE 與 EXPAND_W2 階段顯示） ===
  if (worldTransition.active && (worldTransition.phase === "WALK_EDGE" || worldTransition.phase === "EXPAND_W2")) {
    push();
    let ctx = drawingContext;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.96)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(mapAvatarX, mapAvatarY - 25, worldTransition.spotlightR, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
    pop();
  }

  // === 6. 大地圖頂部與底部 UI ===
  let logoTitle = targetNode.id === "2-0" ? "World 2" : (targetNode.id === "2-SHOP" ? "World 2 Shop" : `World ${targetNode.label}`);
  drawColorfulWorldLogo(logoTitle, 30, 44, min(38, width * 0.05));

  drawPlayerHeadBadge(50, 102, 20);
  stroke(0);
  strokeWeight(5);
  fill("#FFFFFF");
  textFont("Arial Black, sans-serif");
  textSize(24);
  textAlign(LEFT, CENTER);
  text(`× ${lives}`, 80, 104);

  stroke(0);
  strokeWeight(5);
  fill(targetNode.unlocked ? "#FFD166" : "#ADB5BD");
  textSize(min(24, width * 0.035));
  textAlign(RIGHT, CENTER);
  text(targetNode.unlocked ? targetNode.title : "🔒 尚未解鎖", width - 30, 44);

  // 右上角：視角與設定按鈕
  stroke(0);
  strokeWeight(3);
  fill(20, 30, 50, 210);
  rect(width - 156, 74, 126, 34, 17);
  noStroke();
  fill("#FFD166");
  textSize(14);
  textAlign(CENTER, CENTER);
  text("⚙ 視角與設定", width - 93, 91);

  // 右下角 Items 備用道具按鈕
  let itemBtnW = 135;
  let itemBtnH = 44;
  let itemBtnX = width - itemBtnW - 24;
  let itemBtnY = height - itemBtnH - 20;
  stroke(0);
  strokeWeight(3.5);
  fill(20, 30, 50, 210);
  rect(itemBtnX, itemBtnY, itemBtnW, itemBtnH, 22);
  noStroke();
  fill("#FFFFFF");
  textFont("Arial Black, sans-serif");
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Items [I]", itemBtnX + itemBtnW / 2, itemBtnY + itemBtnH / 2);

  // 底部操作提示 / 手機按鈕
  if (controlMode === "MOBILE") {
    let pad = getMobileMapPadRects();
    stroke(0);
    strokeWeight(3);
    textFont("Arial Black, sans-serif");
    textAlign(CENTER, CENTER);

    for (let k of ["up", "down", "left", "right"]) {
      let b = pad[k];
      fill("#1F2E46");
      rect(b.x, b.y, b.w, b.h, 12);
      noStroke();
      fill("#FFFFFF");
      textSize(18);
      text(b.label, b.x + b.w / 2, b.y + b.h / 2);
      stroke(0);
    }

    fill("#34C759");
    rect(pad.go.x, pad.go.y, pad.go.w, pad.go.h, 14);
    noStroke();
    fill("#FFFFFF");
    textSize(20);
    text("GO!", pad.go.x + pad.go.w / 2, pad.go.y + pad.go.h / 2);
  } else {
    stroke(0);
    strokeWeight(4);
    fill("#FFFFFF");
    textSize(16);
    textAlign(LEFT, CENTER);
    text("← → ↑ ↓ 選擇路線  ｜  Enter / 空白鍵 / 點擊進入", 30, height - 42);
  }

  // 備用道具箱彈窗
  if (showMapItemDrawer) {
    fill(0, 0, 0, 170);
    rect(0, 0, width, height);
    let panelW = min(360, width * 0.85);
    let panelH = 210;
    stroke("#FFD166");
    strokeWeight(4);
    fill("#1D2D44");
    rect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 18);
    noStroke();
    fill("#FFD166");
    textSize(22);
    textAlign(CENTER, TOP);
    text("備用道具箱 (ITEM STOCK)", width / 2, height / 2 - panelH / 2 + 20);
    if (reservedItem) {
      drawPowerupIcon(reservedItem, width / 2, height / 2 + 5, 1.6);
      fill(255);
      textSize(15);
      text(controlMode === "MOBILE" ? "進入關卡後點擊上方道具框即可空投！" : "進入關卡後按 [B] 鍵即可呼叫空投！", width / 2, height / 2 + 50);
    } else {
      fill(190);
      textSize(16);
      text("目前備用道具箱是空的", width / 2, height / 2 + 10);
    }
    fill("#8D99AE");
    textSize(13);
    text("點擊視窗或按 [I] 關閉", width / 2, height / 2 + panelH / 2 - 28);
  }

  // 沙漠補給屋彈窗
  if (showShopModal) {
    drawDesertShopModal();
  }
}

function enterSelectedMapNode() {
  let node = mapNodesData[selectedMapNode];
  if (!node || !node.unlocked) {
    playSFX("stomp");
    return;
  }
  if (node.type === "shop") {
    openDesertShop();
    return;
  }
  if (node.type === "junction") {
    selectedMapNode = "2-1";
    playSFX("mapMove");
    return;
  }
  // 每次從大地圖重新進入關卡，一律清空上一輪的中繼存檔點與秘密通關標記
  checkpointState.active = false;
  isSecretClear = false;

  let parts = node.id.split("-");
  currentWorld = int(parts[0]);
  let lvlNum = int(parts[1]);
  startLevel(lvlNum, false, true);
}

// <--- 新增以下兩個共用函式：大地圖方向移動 + 手機十字鍵座標
function moveWorldMapCursor(moveDir) {
  let curNode = mapNodesData[selectedMapNode];
  if (!moveDir || !curNode || !curNode.neighbors) return;

  let targetId = curNode.neighbors[moveDir];
  if (targetId === "TO_W1") {
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
}

function getMobileMapPadRects() {
  let s = 46;
  let cx = 86;
  let cy = height - 74;
  return {
    up:    { x: cx - s / 2, y: cy - s * 1.35, w: s, h: s, label: "▲", dir: "up" },
    down:  { x: cx - s / 2, y: cy + s * 0.35, w: s, h: s, label: "▼", dir: "down" },
    left:  { x: cx - s * 1.45, y: cy - s / 2, w: s, h: s, label: "◀", dir: "left" },
    right: { x: cx + s * 0.45, y: cy - s / 2, w: s, h: s, label: "▶", dir: "right" },
    go:    { x: cx + s * 1.85, y: cy - s * 0.55, w: 96, h: s * 1.1, label: "GO!" }
  };
}

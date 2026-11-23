// =====================================================================
// world2_miner.js — 2-4 幽暗礦坑：頭燈、火把、黑暗遮罩、補給室狀態。
// =====================================================================

window.isInMinerSupplyRoom = false; // 是否正在 2-4 全亮礦工裝備補給密室中

let saved2_4MainState = null;       // 暫存 2-4 主礦坑狀態

let initialW2L4Spawns = null;       // 暫存 2-4 初始敵人與平台 spawn 副本（方案 E）

let torchCount = 0;                // 額外道具欄：火把數量（消耗品）

let placedTorches = [];            // 場上已擺放的火把座標 [{x, y}]

let hasMinerHeadlamp = false;      // 是否戴上礦工頭燈（梯形手電筒光束）

let minerLampPickup = null;        // 2-4 開場地上的頭燈裝備架 {x, y, taken}

let endClearBonusSmoke = [];       // 拉旗結算時頭燈與火把化為白煙特效

// =====================================================================
// 2-4 黑暗礦坑火把/頭燈系統
// =====================================================================
function updateMinerLampAndTorches() {
  if (minerLampPickup && !minerLampPickup.taken) {
    if (dist(characterX, characterY, minerLampPickup.x, minerLampPickup.y) < 42) {
      minerLampPickup.taken = true;
      hasMinerHeadlamp = true;
      torchCount += 3;
      playSFX("powerup");
      floatingTexts.push({
        text: "戴上礦工頭燈！獲得 3 根火把（按 E/T 插火把）",
        x: characterX - 90,
        y: characterY - 55,
        vy: -1.1,
        life: 120,
        isOneUp: true
      });
    }
  }
}

function placeTorchAtPlayer() {
  if (torchCount <= 0) {
    playSFX("stomp");
    floatingTexts.push({ text: "沒有火把了！", x: characterX - 30, y: characterY - 40, vy: -1.2, life: 45 });
    return;
  }
  torchCount--;
  placedTorches.push({ x: characterX, y: characterY + 8 });
  playSFX("fireball");
  floatingTexts.push({ text: `放置火把 (剩餘 ${torchCount})`, x: characterX - 45, y: characterY - 40, vy: -1.2, life: 55 });
}

// 2-4 黑暗礦坑：繪製頭燈架、火把、過關白煙與黑暗挖空視野
function drawMinerLampAndTorches(viewWorldW, viewWorldH) {
  // 1. 繪製地上的頭燈裝備架
  if (minerLampPickup && !minerLampPickup.taken) {
    push();
    translate(minerLampPickup.x, minerLampPickup.y);
    noStroke();
    fill("#8D5524");
    rect(-4, -10, 8, 28, 2);
    fill("#FFD166");
    arc(0, -12, 26, 20, PI, TWO_PI);
    fill("#FFF3B0");
    ellipse(6, -15, 10, 10);
    pop();
  }

  // 2. 繪製場上已插好的火把
  for (let t of placedTorches) {
    push();
    translate(t.x, t.y);
    noStroke();
    fill("#6F4E37");
    rect(-3, -6, 6, 22, 2);
    let flicker = sin(frameCount * 0.35 + t.x) * 3;
    fill("#FF5400");
    ellipse(0, -12, 14 + flicker * 0.4, 20 + flicker);
    fill("#FFD166");
    ellipse(0, -10, 7, 11);
    pop();
  }

  // 3. 繪製過關時裝備化為白煙消散特效
  for (let i = endClearBonusSmoke.length - 1; i >= 0; i--) {
    let sm = endClearBonusSmoke[i];
    sm.x += sm.vx;
    sm.y += sm.vy;
    sm.alpha -= 4;
    noStroke();
    fill(255, 255, 255, max(0, sm.alpha));
    ellipse(sm.x, sm.y, sm.r, sm.r);
    if (sm.alpha <= 0) endClearBonusSmoke.splice(i, 1);
  }

  // 4. 使用獨立離屏遮罩層挖洞（僅在黑暗主礦坑顯示，全亮補給室完全不畫黑幕與假光束）
  if (window.isInMinerSupplyRoom) return;

  if (!window.darkMaskBuffer || window.darkMaskBuffer.width !== width || window.darkMaskBuffer.height !== height) {
    window.darkMaskBuffer = createGraphics(width, height);
  }
  let db = window.darkMaskBuffer;
  let dctx = db.drawingContext;
  let z = getEffectiveViewZoom();
  let mapOffsetY = (height / z) - (levelMap.length * TILE_SIZE);

  // 頭燈光源位置對準角色額頭
  let isBigNow = (powerLevel >= 2);
  let lampX = characterX + facingDirection * (isBigNow ? 10 : 8);
  let lampY = characterY - (isBigNow ? 26 : 16);

  dctx.save();
  dctx.globalCompositeOperation = "source-over";
  dctx.clearRect(0, 0, width, height);

  // 深邃礦坑黑幕
  dctx.fillStyle = "rgba(4, 4, 10, 0.95)";
  dctx.fillRect(0, 0, width, height);

  dctx.globalCompositeOperation = "destination-out";
  dctx.scale(z, z);
  dctx.translate(-cameraX, mapOffsetY);

  // (A) 主角周圍柔和微光圈（帶頭燈時保留自然環境微光，不戴時稍大一點）
  let baseR = hasMinerHeadlamp ? 145 : 165;
  let gradP = dctx.createRadialGradient(characterX, characterY - 6, 18, characterX, characterY - 6, baseR);
  gradP.addColorStop(0, "rgba(0,0,0,1)");
  gradP.addColorStop(0.45, "rgba(0,0,0,0.82)");
  gradP.addColorStop(0.78, "rgba(0,0,0,0.32)");
  gradP.addColorStop(1, "rgba(0,0,0,0)");
  dctx.fillStyle = gradP;
  dctx.beginPath();
  dctx.arc(characterX, characterY - 6, baseR, 0, Math.PI * 2);
  dctx.fill();

  // (B) 戴上礦工頭燈：用「多段重疊柔焦光斑 + 模糊濾鏡」取代生硬三角形，徹底消除硬切線！
  if (hasMinerHeadlamp) {
    dctx.save();
    dctx.filter = "blur(18px)";
    let dir = facingDirection;
    let spots = [
      { dist: 55,  r: 58,  a: 0.95 },
      { dist: 125, r: 92,  a: 0.92 },
      { dist: 215, r: 130, a: 0.85 },
      { dist: 315, r: 165, a: 0.68 },
      { dist: 400, r: 190, a: 0.38 }
    ];
    for (let sp of spots) {
      let sx = lampX + dir * sp.dist;
      let sy = lampY + 6;
      let g = dctx.createRadialGradient(sx, sy, sp.r * 0.15, sx, sy, sp.r);
      g.addColorStop(0, `rgba(0,0,0,${sp.a})`);
      g.addColorStop(0.6, `rgba(0,0,0,${sp.a * 0.55})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.restore();
  }

  // (C) 場上每根火把的柔和光圈
  for (let t of placedTorches) {
    let flicker = sin(frameCount * 0.22 + t.x) * 8;
    let tr = 215 + flicker;
    let gradT = dctx.createRadialGradient(t.x, t.y - 10, 20, t.x, t.y - 10, tr);
    gradT.addColorStop(0, "rgba(0,0,0,1)");
    gradT.addColorStop(0.5, "rgba(0,0,0,0.8)");
    gradT.addColorStop(0.82, "rgba(0,0,0,0.28)");
    gradT.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = gradT;
    dctx.beginPath();
    dctx.arc(t.x, t.y - 10, tr, 0, Math.PI * 2);
    dctx.fill();
  }
  dctx.restore();

  // 貼回黑暗遮罩層
  push();
  resetMatrix();
  imageMode(CORNER);
  image(db, 0, 0);

  // 5. 疊加自然暖黃色柔和光暈（同樣使用柔焦光斑，沒有任何生硬幾何邊界）
  let ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.scale(z, z);
  ctx.translate(-cameraX, mapOffsetY);

  // 主角周圍暖黃環境微光
  let pGlow = ctx.createRadialGradient(characterX, characterY - 6, 12, characterX, characterY - 6, hasMinerHeadlamp ? 140 : 160);
  pGlow.addColorStop(0, "rgba(255, 215, 115, 0.22)");
  pGlow.addColorStop(0.6, "rgba(255, 180, 65, 0.08)");
  pGlow.addColorStop(1, "rgba(255, 160, 40, 0)");
  ctx.fillStyle = pGlow;
  ctx.beginPath();
  ctx.arc(characterX, characterY - 6, hasMinerHeadlamp ? 140 : 160, 0, Math.PI * 2);
  ctx.fill();

  // 頭燈暖金柔焦光束
  if (hasMinerHeadlamp) {
    let dir = facingDirection;
    let glowSpots = [
      { dist: 35,  r: 52,  a: 0.34 },
      { dist: 110, r: 88,  a: 0.26 },
      { dist: 205, r: 128, a: 0.18 },
      { dist: 310, r: 162, a: 0.10 }
    ];
    for (let sp of glowSpots) {
      let sx = lampX + dir * sp.dist;
      let sy = lampY + 6;
      let bGlow = ctx.createRadialGradient(sx, sy, 8, sx, sy, sp.r);
      bGlow.addColorStop(0, `rgba(255, 228, 135, ${sp.a})`);
      bGlow.addColorStop(0.55, `rgba(255, 190, 75, ${sp.a * 0.45})`);
      bGlow.addColorStop(1, "rgba(255, 150, 30, 0)");
      ctx.fillStyle = bGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 每根火把的橘黃燭光暈染
  for (let t of placedTorches) {
    let tr = 215 + sin(frameCount * 0.22 + t.x) * 8;
    let tGlow = ctx.createRadialGradient(t.x, t.y - 10, 14, t.x, t.y - 10, tr);
    tGlow.addColorStop(0, "rgba(255, 200, 80, 0.38)");
    tGlow.addColorStop(0.55, "rgba(255, 150, 40, 0.14)");
    tGlow.addColorStop(1, "rgba(255, 120, 20, 0)");
    ctx.fillStyle = tGlow;
    ctx.beginPath();
    ctx.arc(t.x, t.y - 10, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  pop();
}
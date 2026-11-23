// =====================================================================
// world2_atmosphere.js — 世界 2 的背景氣氛與地標繪製。
// =====================================================================

// =====================================================================
// World 2 (2-1 ~ 2-4) 零文字視覺連貫場景：光影色溫漸變 ＋ 起點來路地標
// =====================================================================
function drawWorld2AtmosphereAndLandmarks() {
  if (currentWorld !== 2) return;

  push();
  noStroke();

  // --- 1. 遠景層（依關卡逐漸變深，呈現從地表走進地底的過程） ---
  if (currentLevel === 1) {
    // 2-1：烈日沙漠遠景金字塔
    fill("#E76F51");
    triangle(cameraX * 0.7 + 320, 420, cameraX * 0.7 + 460, 210, cameraX * 0.7 + 600, 420);
    fill("#FFF3B0");
    circle(cameraX + width * 0.78, 95, 76);
  } else if (currentLevel === 2) {
    // 2-2：沙暴黃昏轉入地下邊緣（遠景半掩埋的遺跡石柱）
    fill(180, 120, 60, 85);
    for (let i = 0; i < 10; i++) {
      let rx = i * 340 + cameraX * 0.45;
      rect(rx, 80, 55, 520);
      rect(rx - 12, 80, 79, 26);
    }
  } else if (currentLevel === 3) {
    // 2-3：太陽神殿深處（暗紅神殿壁柱＋微弱火把壁燈光暈）
    fill("#1E1008");
    for (let i = 0; i < 12; i++) {
      let px = i * 300 + cameraX * 0.35;
      rect(px, 0, 70, 640);
      fill(255, 110, 30, 45);
      circle(px + 35, 190, 110);
      fill("#1E1008");
    }
  } else if (currentLevel === 4 && !window.isInMinerSupplyRoom) {
    // 2-4：幽暗古礦坑（深處礦道木梁支架）
    fill("#121222");
    for (let i = 0; i < 14; i++) {
      let mx = i * 280 + cameraX * 0.3;
      rect(mx, 0, 22, 640);
      rect(mx + 140, 0, 22, 640);
      rect(mx - 10, 40, 182, 20);
    }
  }

  // --- 2. 起點「來路地標」（讓玩家一進關卡往左看就知道自己怎麼來到這裡的） ---
  if (currentLevel === 2) {
    // 【2-2 起點】上方沙穴洞口＋斜射陽光光束＋向下的砂岩石階
    fill("#5C4033");
    for (let s = 0; s < 5; s++) {
      rect(10 + s * 26, 220 + s * 36, 95 - s * 10, 36);
    }
    fill(255, 245, 185, 55);
    quad(0, 0, 130, 0, 270, 520, 40, 520);
  } else if (currentLevel === 3) {
    // 【2-3 起點】上方神殿豎井入口＋垂落的繩梯（表示從上一區垂降進入神殿）
    fill("#3D2314");
    rect(45, 0, 16, 170);
    rect(135, 0, 16, 170);
    stroke("#C9963B");
    strokeWeight(3);
    line(76, 0, 76, 240);
    line(116, 0, 116, 225);
    for (let ry = 24; ry < 220; ry += 26) {
      line(76, ry, 116, ry);
    }
    noStroke();
  } else if (currentLevel === 4 && !window.isInMinerSupplyRoom) {
    // 【2-4 主礦坑起點】左側已升起開啟的厚重黑鐵礦坑閘門
    fill("#2B2D42");
    rect(18, 320, 112, 160, 8, 8, 0, 0);
    fill("#090912");
    rect(34, 340, 80, 140, 4, 4, 0, 0);
    fill("#6C757D");
    rect(34, 340, 80, 22);
    for (let gx = 40; gx < 110; gx += 14) {
      triangle(gx, 362, gx + 8, 362, gx + 4, 374);
    }
  }

  pop();
}

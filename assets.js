// =====================================================================
// assets.js — 圖片素材載入、精靈圖量測、像素材質包產生。
// =====================================================================

let walkSpriteSheet; 

let standSpriteSheet; 

let jumpSpriteSheet; 

let jumpMoveSpriteSheet; 

let fallingSpriteSheet; 

let attackSpriteSheet;  

let squatSpriteSheet;      

let squatMoveSpriteSheet;  

let deadSpriteSheet;

let muzzleFlashImg;     

let hitEffectImg;       

let spriteMetrics = {};

// 離線生成高質感像素材質包
let textures = {};

function preload() { 
  walkSpriteSheet = loadImage("action/walk/ALL3.png"); 
  standSpriteSheet = loadImage("action/stand/ALL1.png"); 
  jumpSpriteSheet = loadImage("action/jump/ALL2.png"); 
  jumpMoveSpriteSheet = loadImage("action/jumpforward/ALL4.png"); 
  fallingSpriteSheet = loadImage("action/falling/ALL5.png"); 
  
  squatSpriteSheet = loadImage("action/squat_down/squat_down.png", () => {}, () => console.error("找不到蹲下圖片")); 
  squatMoveSpriteSheet = loadImage("action/squat_down_move/squat_down_move.png", () => {}, () => console.error("找不到蹲下走路圖片")); 
  deadSpriteSheet = loadImage("action/dead/momi_dead.png", () => {}, () => console.error("找不到死亡動畫圖片"));

  attackSpriteSheet = loadImage("action/attackA/ALL5.png", () => {}, () => console.error("找不到攻擊圖片")); 
  muzzleFlashImg = loadImage("action/special_effects/hit-removebg-preview.png", () => {}, () => console.error("找不到槍口特效")); 
  hitEffectImg = loadImage("action/special_effects/hited-removebg-preview.png", () => {}, () => console.error("找不到擊中特效")); 
} 

function measureSpriteMetrics(img, frameCount) {
  if (!img || img.width === 0) {
    return { contentHeight: 100, minY: 0, frameBottomPaddings: new Array(frameCount).fill(0), frameHeight: 100 };
  }
  img.loadPixels();
  let fw = floor(img.width / frameCount);
  let fh = img.height;
  let frameBottomPaddings = [];
  let maxContentHeight = 0;
  let globalMinY = fh;

  for (let f = 0; f < frameCount; f++) {
    let minY = fh;
    let maxY = 0;
    let startX = f * fw;
    let endX = startX + fw;

    for (let y = 0; y < fh; y++) {
      for (let x = startX; x < endX; x++) {
        let idx = (y * img.width + x) * 4;
        let alpha = img.pixels[idx + 3];
        if (alpha > 20) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minY > maxY) {
      minY = 0;
      maxY = fh - 1;
    }
    if (minY < globalMinY) globalMinY = minY;
    let ch = maxY - minY + 1;
    if (ch > maxContentHeight) maxContentHeight = ch;
    frameBottomPaddings.push((fh - 1) - maxY);
  }

  return {
    contentHeight: maxContentHeight,
    minY: globalMinY,
    frameBottomPaddings: frameBottomPaddings,
    frameHeight: fh
  };
}

// --- 離線生成高品質像素材質包（完整保留原版細節） ---
function buildTexturePack() {
  let gDay = createGraphics(TILE_SIZE, TILE_SIZE);
  gDay.noStroke();
  gDay.fill("#C85A32");
  gDay.rect(0, 0, TILE_SIZE, TILE_SIZE);
  gDay.fill("#9E3F1E");
  gDay.rect(6, 16, 10, 8, 2);
  gDay.rect(24, 26, 10, 8, 2);
  gDay.fill("#38B000");
  gDay.rect(0, 0, TILE_SIZE, 10);
  gDay.fill("#70E000");
  gDay.rect(0, 0, TILE_SIZE, 4);
  gDay.fill("#38B000");
  gDay.triangle(4, 10, 10, 16, 16, 10);
  gDay.triangle(22, 10, 28, 17, 34, 10);
  textures["G_DAY"] = gDay;

  let gUnder = createGraphics(TILE_SIZE, TILE_SIZE);
  gUnder.noStroke();
  gUnder.fill("#1D4E89");
  gUnder.rect(0, 0, TILE_SIZE, TILE_SIZE);
  gUnder.fill("#3A86FF");
  gUnder.rect(2, 2, TILE_SIZE - 4, 4);
  gUnder.fill("#0B2545");
  gUnder.rect(0, TILE_SIZE - 4, TILE_SIZE, 4);
  gUnder.rect(19, 0, 2, 20);
  gUnder.rect(0, 19, TILE_SIZE, 2);
  textures["G_UNDER"] = gUnder;

  let gSky = createGraphics(TILE_SIZE, TILE_SIZE);
  gSky.noStroke();
  gSky.fill("#6D597A");
  gSky.rect(0, 0, TILE_SIZE, TILE_SIZE);
  gSky.fill("#B56576");
  gSky.rect(0, 0, TILE_SIZE, 8);
  gSky.fill("#355070");
  gSky.rect(0, TILE_SIZE - 5, TILE_SIZE, 5);
  textures["G_SKY"] = gSky;

  let gCastle = createGraphics(TILE_SIZE, TILE_SIZE);
  gCastle.noStroke();
  gCastle.fill("#495057");
  gCastle.rect(0, 0, TILE_SIZE, TILE_SIZE);
  gCastle.fill("#6C757D");
  gCastle.rect(2, 2, 17, 16);
  gCastle.rect(21, 2, 17, 16);
  gCastle.rect(10, 21, 18, 17);
  gCastle.fill("#212529");
  gCastle.rect(0, 19, TILE_SIZE, 2);
  gCastle.rect(19, 0, 2, 20);
  gCastle.rect(8, 20, 2, 20);
  textures["G_CASTLE"] = gCastle;

  let brick = createGraphics(TILE_SIZE, TILE_SIZE);
  brick.noStroke();
  brick.fill("#B5432A");
  brick.rect(0, 0, TILE_SIZE, TILE_SIZE);
  brick.fill("#E07A5F");
  brick.rect(1, 1, 18, 3);
  brick.rect(21, 1, 18, 3);
  brick.rect(1, 21, 8, 3);
  brick.rect(11, 21, 18, 3);
  brick.rect(31, 21, 8, 3);
  brick.fill("#3D1E16");
  brick.rect(0, 18, TILE_SIZE, 2);
  brick.rect(0, 38, TILE_SIZE, 2);
  brick.rect(19, 0, 2, 18);
  brick.rect(9, 20, 2, 18);
  brick.rect(29, 20, 2, 18);
  textures["BRICK"] = brick;

  let qBox = createGraphics(TILE_SIZE, TILE_SIZE);
  qBox.noStroke();
  qBox.fill("#F4A261");
  qBox.rect(0, 0, TILE_SIZE, TILE_SIZE, 4);
  qBox.fill("#FFD166");
  qBox.rect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6, 3);
  qBox.fill("#9C6644");
  qBox.rect(5, 5, 3, 3);
  qBox.rect(TILE_SIZE - 8, 5, 3, 3);
  qBox.rect(5, TILE_SIZE - 8, 3, 3);
  qBox.rect(TILE_SIZE - 8, TILE_SIZE - 8, 3, 3);
  qBox.textAlign(CENTER, CENTER);
  qBox.textSize(24);
  qBox.textStyle(BOLD);
  qBox.fill("#7F4F24");
  qBox.text("?", TILE_SIZE / 2 + 2, TILE_SIZE / 2 + 2);
  qBox.fill("#FFF3B0");
  qBox.text("?", TILE_SIZE / 2, TILE_SIZE / 2);
  textures["QBOX"] = qBox;

  let emptyBox = createGraphics(TILE_SIZE, TILE_SIZE);
  emptyBox.noStroke();
  emptyBox.fill("#582F0E");
  emptyBox.rect(0, 0, TILE_SIZE, TILE_SIZE, 4);
  emptyBox.fill("#7F4F24");
  emptyBox.rect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6, 3);
  emptyBox.fill("#432818");
  emptyBox.rect(6, 6, 3, 3);
  emptyBox.rect(TILE_SIZE - 9, 6, 3, 3);
  emptyBox.rect(6, TILE_SIZE - 9, 3, 3);
  emptyBox.rect(TILE_SIZE - 9, TILE_SIZE - 9, 3, 3);
  textures["EMPTY"] = emptyBox;

  let pipe = createGraphics(TILE_SIZE, TILE_SIZE);
  pipe.noStroke();
  pipe.fill("#1B7F3A");
  pipe.rect(2, 0, TILE_SIZE - 4, TILE_SIZE);
  pipe.fill("#2EC4B6");
  pipe.rect(5, 0, 5, TILE_SIZE);
  pipe.fill("#80ED99");
  pipe.rect(12, 0, 10, TILE_SIZE);
  pipe.fill("#134E27");
  pipe.rect(TILE_SIZE - 8, 0, 6, TILE_SIZE);
  textures["PIPE"] = pipe;

  let pipeTop = createGraphics(TILE_SIZE, TILE_SIZE);
  pipeTop.noStroke();
  pipeTop.fill("#1B7F3A");
  pipeTop.rect(2, 16, TILE_SIZE - 4, TILE_SIZE - 16);
  pipeTop.fill("#80ED99");
  pipeTop.rect(12, 16, 10, TILE_SIZE - 16);
  pipeTop.fill("#134E27");
  pipeTop.rect(TILE_SIZE - 8, 16, 6, TILE_SIZE - 16);
  pipeTop.fill("#0D3B1E");
  pipeTop.rect(0, 0, TILE_SIZE, 18, 3);
  pipeTop.fill("#2EC4B6");
  pipeTop.rect(2, 2, TILE_SIZE - 4, 14, 2);
  pipeTop.fill("#80ED99");
  pipeTop.rect(6, 2, 12, 14);
  pipeTop.fill("#134E27");
  pipeTop.rect(TILE_SIZE - 7, 2, 5, 14);
  pipeTop.fill("#0D3B1E");
  pipeTop.rect(2, 18, TILE_SIZE - 4, 3);
  textures["PIPE_TOP"] = pipeTop;

  let pipeH = createGraphics(TILE_SIZE, TILE_SIZE);
  pipeH.noStroke();
  pipeH.fill("#1B7F3A");
  pipeH.rect(0, 2, TILE_SIZE, TILE_SIZE - 4);
  pipeH.fill("#2EC4B6");
  pipeH.rect(0, 5, TILE_SIZE, 5);
  pipeH.fill("#80ED99");
  pipeH.rect(0, 12, TILE_SIZE, 10);
  pipeH.fill("#134E27");
  pipeH.rect(0, TILE_SIZE - 8, TILE_SIZE, 6);
  pipeH.fill("#0D3B1E");
  pipeH.rect(0, 0, 10, TILE_SIZE);
  pipeH.fill("#80ED99");
  pipeH.rect(2, 10, 6, 12);
  textures["PIPE_H"] = pipeH;

  let stair = createGraphics(TILE_SIZE, TILE_SIZE);
  stair.noStroke();
  stair.fill("#9C6644");
  stair.rect(0, 0, TILE_SIZE, TILE_SIZE);
  stair.fill("#DDB892");
  stair.triangle(0, 0, TILE_SIZE, 0, 0, TILE_SIZE);
  stair.fill("#7F5539");
  stair.triangle(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, 0, TILE_SIZE);
  stair.fill("#B08968");
  stair.rect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12);
  textures["STAIR"] = stair;
  // 1. 城堡紅磚牆材質 (CASTLE_WALL)
  let cWall = createGraphics(TILE_SIZE, TILE_SIZE);
  cWall.noStroke();
  cWall.fill("#9B2226");
  cWall.rect(0, 0, TILE_SIZE, TILE_SIZE);
  cWall.fill("#CA6702");
  cWall.rect(1, 1, 18, 8);
  cWall.rect(21, 1, 18, 8);
  cWall.rect(1, 21, 18, 8);
  cWall.rect(21, 21, 18, 8);
  cWall.fill("#540B0E");
  cWall.rect(0, 18, TILE_SIZE, 2);
  cWall.rect(0, 38, TILE_SIZE, 2);
  cWall.rect(19, 0, 2, 18);
  cWall.rect(9, 20, 2, 18);
  cWall.rect(29, 20, 2, 18);
  textures["CASTLE_WALL"] = cWall;

  // 2. 城堡頂部城垛材質 (CASTLE_TOP)
  let cTop = createGraphics(TILE_SIZE, TILE_SIZE);
  cTop.noStroke();
  cTop.fill("#9B2226");
  cTop.rect(0, 14, TILE_SIZE, TILE_SIZE - 14);
  cTop.fill("#CA6702");
  cTop.rect(2, 0, 14, 16, 2);
  cTop.rect(24, 0, 14, 16, 2);
  cTop.fill("#540B0E");
  cTop.rect(0, 14, TILE_SIZE, 3);
  cTop.rect(0, 38, TILE_SIZE, 2);
  textures["CASTLE_TOP"] = cTop;

  // 3. 城堡黑拱門材質 (CASTLE_DOOR)
  let cDoor = createGraphics(TILE_SIZE, TILE_SIZE);
  cDoor.noStroke();
  cDoor.fill("#9B2226");
  cDoor.rect(0, 0, TILE_SIZE, TILE_SIZE);
  cDoor.fill("#CA6702");
  cDoor.rect(2, 2, TILE_SIZE - 4, TILE_SIZE - 2, 18, 18, 0, 0);
  cDoor.fill("#140B0B");
  cDoor.rect(6, 8, TILE_SIZE - 12, TILE_SIZE - 8, 14, 14, 0, 0);
  textures["CASTLE_DOOR"] = cDoor;
}

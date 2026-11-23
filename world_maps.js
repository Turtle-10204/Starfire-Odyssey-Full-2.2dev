// =====================================================================
// World 2 (2-1 ~ 2-5) 專屬手工關卡與密室地圖生成器 (world_maps.js)
// 四幕遞進式長關卡設計（240~300 格，約 45~65 秒飽滿探索節奏，絕無複製貼上）
// =====================================================================

const WORLD2_LEVEL_CONFIGS = {
  1: { id: "2-1", name: "黃沙綠洲",     totalCols: 245, checkpointCol: 122, isBossStage: false, theme: "oasis",         timeLimit: 400 },
  2: { id: "2-2", name: "無盡流沙海",   totalCols: 255, checkpointCol: 128, isBossStage: false, theme: "quicksand",     timeLimit: 420 },
  3: { id: "2-3", name: "太陽神殿",     totalCols: 255, checkpointCol: 128, isBossStage: false, theme: "temple",        timeLimit: 450 },
  4: { id: "2-4", name: "幽暗古礦坑",   totalCols: 265, checkpointCol: 132, isBossStage: false, theme: "dark_mine",     timeLimit: 480 },
  5: { id: "2-5", name: "沙暴巨蟲巢穴", totalCols: 300, checkpointCol: 130, isBossStage: true,  theme: "sandworm_boss", timeLimit: 550 }
};

function buildWorld2Level(lvlNum) {
  let cfg = WORLD2_LEVEL_CONFIGS[lvlNum] || WORLD2_LEVEL_CONFIGS[1];
  let rows = 15;
  let cols = cfg.totalCols;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  let enemySpawns = [];
  let platformSpawns = [];

  const setTile = (r, c, ch) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch;
  };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) setTile(r, c, ch);
    }
  };
  const digPit = (startCol, width, fillChar = ' ') => {
    for (let c = startCol; c < startCol + width; c++) {
      setTile(13, c, fillChar);
      setTile(14, c, fillChar);
    }
  };
  const addCoinArc = (startCol, peakRow, count = 5) => {
    for (let i = 0; i < count; i++) {
      let arch = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 2);
      setTile(peakRow - arch, startCol + i, 'O');
    }
  };

  // 基礎地板（2-3 神殿與 2-4 礦坑有天然岩石天花板）
  fillRect(13, 0, 14, cols - 1, 'G');
  if (lvlNum === 3 || lvlNum === 4) {
    fillRect(0, 0, 0, cols - 1, 'G');
  }

  // 起點安全區補給（挑高至 row 8，衝刺起跳絕不卡頭）
  setTile(8, 8, '?');
  setTile(8, 9, 'M');
  setTile(8, 10, '?');

  // =================================================================
  // 【2-1 黃沙綠洲】（245 格）：四幕綠洲遠征＋後段隱密特殊流沙
  // =================================================================
  if (lvlNum === 1) {
    // 第一幕（col 16 ~ 66）：綠洲水池與仙人掌高低道
    fillRect(11, 16, 12, 18, 'S');
    digPit(19, 4, 'Q');
    fillRect(11, 23, 12, 25, 'S');
    addCoinArc(19, 8, 4);

    fillRect(7, 29, 7, 40, 'B'); // 挑高磚橋，上下動線完全不卡頭
    setTile(7, 34, 'M');
    addCoinArc(31, 5, 5);
    setTile(12, 33, 'K');
    setTile(11, 33, 'K');
    enemySpawns.push({ type: "goomba", col: 38, row: 12 });

    fillRect(10, 45, 12, 49, 'S');
    fillRect(8,  52, 8,  59, 'T');
    enemySpawns.push({ type: "koopa", col: 55, row: 8 });
    enemySpawns.push({ type: "goomba", col: 62, row: 12 });

    // 第二幕（col 68 ~ 115）：古代砂岩大峽谷與移動浮板
    digPit(69, 16, 'Q');
    fillRect(10, 70, 12, 73, 'S');
    platformSpawns.push({
      x: 75 * 40, y: 9 * 40, w: 120, h: 16,
      minX: 74 * 40, maxX: 82 * 40, speed: 2.2, dx: 0
    });
    fillRect(10, 85, 12, 89, 'S');
    enemySpawns.push({ type: "parakoopa", col: 80, row: 6 });

    fillRect(7, 94, 7, 105, 'B');
    setTile(7, 99, '?');
    setTile(12, 97, 'K');
    enemySpawns.push({ type: "koopa", col: 103, row: 12 });
    addCoinArc(108, 9, 5);

    // --- col 122 為中繼存檔旗 ---

    // 第三幕（col 130 ~ 185）：雙座金字塔遺跡攀登與高空獎勵路線
    fillRect(11, 131, 12, 133, 'S');
    fillRect(9,  134, 12, 136, 'S');
    fillRect(7,  137, 12, 139, 'S');
    setTile(4, 138, '*'); // 第一座金字塔頂端無敵星
    fillRect(9,  140, 12, 142, 'S');
    fillRect(11, 143, 12, 145, 'S');

    digPit(147, 5, 'Q');
    enemySpawns.push({ type: "parakoopa", col: 150, row: 6 });

    // 高空木橋捷徑 vs 地面巡邏隊
    fillRect(6, 155, 6, 172, 'T');
    addCoinArc(158, 4, 6);
    setTile(6, 164, 'M');
    setTile(12, 160, 'K');
    setTile(11, 160, 'K');
    enemySpawns.push({ type: "goomba", col: 166, row: 12 });
    enemySpawns.push({ type: "koopa", col: 171, row: 12 });

    // 第四幕（col 182 ~ 225）：綠洲沙丘衝刺＋終點前隱密特殊流沙彩蛋
    fillRect(9, 182, 12, 186, 'S');
    digPit(187, 5, 'Q');
    fillRect(9, 192, 12, 196, 'S');
    enemySpawns.push({ type: "parakoopa", col: 199, row: 6 });

    fillRect(7, 202, 7, 211, 'B');
    setTile(7, 206, '?');
    enemySpawns.push({ type: "koopa", col: 209, row: 12 });

    // 終點前最後段（col 217 ~ 219）：隱密的特殊流沙坑（外觀與一般流沙相同）
    digPit(217, 3, 'V');
  }

  // =================================================================
  // 【2-2 無盡流沙海】（255 格）：四幕浮空拱橋＋連環沙海橫渡
  // =================================================================
  else if (lvlNum === 2) {
    // 第一幕（col 16 ~ 70）：古代砂岩拱橋群
    digPit(16, 20, 'Q');
    fillRect(10, 17, 12, 20, 'S');
    fillRect(8,  23, 8,  29, 'T');
    addCoinArc(24, 6, 5);
    fillRect(10, 32, 12, 35, 'S');
    enemySpawns.push({ type: "parakoopa", col: 30, row: 6 });

    setTile(8, 41, 'M');
    setTile(12, 45, 'K');
    setTile(11, 45, 'K');
    enemySpawns.push({ type: "koopa", col: 50, row: 12 });
    fillRect(7, 54, 7, 63, 'B');
    setTile(7, 58, '?');

    // 第二幕（col 68 ~ 120）：雙移動石板橫渡流沙大峽谷
    digPit(68, 34, 'Q');
    fillRect(10, 69, 12, 72, 'S');
    platformSpawns.push({
      x: 74 * 40, y: 10 * 40, w: 120, h: 16,
      minX: 73 * 40, maxX: 83 * 40, speed: 2.3, dx: 0
    });
    fillRect(9, 86, 12, 89, 'S');
    platformSpawns.push({
      x: 91 * 40, y: 8 * 40, w: 120, h: 16,
      minX: 90 * 40, maxX: 99 * 40, speed: 2.5, dx: 0
    });
    fillRect(10, 102, 12, 106, 'S');
    addCoinArc(85, 6, 5);
    enemySpawns.push({ type: "parakoopa", col: 95, row: 5 });

    // --- col 128 為中繼存檔旗 ---

    // 第三幕（col 136 ~ 192）：風蝕高石柱連跳與飛行龜陣
    digPit(137, 26, 'Q');
    fillRect(11, 138, 12, 140, 'S');
    fillRect(9,  143, 12, 145, 'S');
    fillRect(7,  148, 12, 150, 'S');
    setTile(4, 149, 'M');
    fillRect(9,  153, 12, 155, 'S');
    fillRect(11, 158, 12, 161, 'S');
    enemySpawns.push({ type: "parakoopa", col: 151, row: 5 });

    // 沙漠綠洲休息站＋雙層磚塊陣
    fillRect(7, 168, 7, 182, 'B');
    setTile(7, 173, '?');
    setTile(7, 177, '*');
    enemySpawns.push({ type: "goomba", col: 171, row: 12 });
    enemySpawns.push({ type: "koopa", col: 179, row: 12 });

    // 第四幕（col 190 ~ 236）：高速拱橋與高低石台衝刺
    digPit(190, 22, 'Q');
    fillRect(10, 191, 12, 194, 'S');
    fillRect(7,  197, 7,  204, 'T');
    addCoinArc(198, 5, 5);
    fillRect(10, 207, 12, 211, 'S');
    enemySpawns.push({ type: "parakoopa", col: 205, row: 5 });

    fillRect(8, 216, 8, 225, 'B');
    setTile(8, 220, '?');
    fillRect(10, 228, 12, 233, 'S');
  }

  // =================================================================
  // 【2-3 太陽神殿】（255 格）：四幕上下雙層神殿走廊＋聖火攀升塔
  // =================================================================
  else if (lvlNum === 3) {
    // 第一幕（col 16 ~ 72）：神殿前廳雙層走廊
    fillRect(7, 16, 7, 36, 'S');
    fillRect(7, 42, 7, 64, 'S');

    addCoinArc(21, 5, 5);
    setTile(4, 28, 'M');
    enemySpawns.push({ type: "parakoopa", col: 39, row: 5 });
    fillRect(5, 47, 5, 57, 'T');
    addCoinArc(49, 3, 5);

    setTile(12, 23, 'K');
    enemySpawns.push({ type: "koopa", col: 30, row: 12 });
    digPit(37, 4, 'L');
    setTile(10, 48, '?');
    setTile(10, 50, '?');
    enemySpawns.push({ type: "goomba", col: 56, row: 12 });

    // 第二幕（col 74 ~ 120）：神殿聖火大廳與高低石柱
    digPit(75, 22, 'L');
    fillRect(10, 76, 12, 80, 'S');
    fillRect(7,  83, 7,  89, 'S');
    setTile(4, 86, '*');
    fillRect(10, 92, 12, 96, 'S');
    enemySpawns.push({ type: "parakoopa", col: 86, row: 4 });

    fillRect(8, 102, 8, 114, 'B');
    setTile(8, 108, '?');
    enemySpawns.push({ type: "koopa", col: 106, row: 12 });
    enemySpawns.push({ type: "goomba", col: 112, row: 12 });

    // --- col 128 為中繼存檔旗 ---

    // 第三幕（col 136 ~ 192）：太陽神殿垂直上升塔（一路往上攀登至頂層走廊）
    digPit(137, 32, 'L');
    fillRect(11, 138, 12, 142, 'S');
    fillRect(9,  145, 9,  150, 'S');
    setTile(6, 147, 'M');
    platformSpawns.push({
      x: 152 * 40, y: 7 * 40, w: 120, h: 16,
      minX: 151 * 40, maxX: 161 * 40, speed: 2.2, dx: 0
    });
    fillRect(5, 164, 12, 171, 'S'); // 頂層神殿聖壇
    addCoinArc(165, 3, 5);
    enemySpawns.push({ type: "koopa", col: 168, row: 5 });

    // 第四幕（col 176 ~ 236）：神殿上層長廊與階梯俯衝出口
    fillRect(7, 176, 7, 198, 'S');
    setTile(4, 186, '?');
    digPit(180, 5, 'L');
    digPit(190, 5, 'L');
    enemySpawns.push({ type: "parakoopa", col: 196, row: 5 });

    fillRect(9,  204, 12, 209, 'S');
    fillRect(7,  212, 7,  220, 'B');
    setTile(7, 216, 'M');
    enemySpawns.push({ type: "koopa", col: 215, row: 12 });
    fillRect(10, 224, 12, 230, 'S');
  }

  // =================================================================
  // 【2-4 幽暗古礦坑】（265 格）：四幕上層木棧道 vs 下層寶藏暗道＋火把節奏
  // =================================================================
  else if (lvlNum === 4) {
    // 入口處放置前往全亮補給密室的綠色水管 'p'
    fillRect(11, 14, 12, 15, 'p');

    // 第一幕（col 20 ~ 76）：雙層礦道岔路
    fillRect(7, 22, 7, 45, 'T');
    setTile(4, 27, 't'); // 火把補給
    addCoinArc(32, 5, 5);
    enemySpawns.push({ type: "goomba", col: 39, row: 7 });

    setTile(10, 30, 'M');
    fillRect(10, 36, 10, 43, 'B');
    setTile(10, 39, '*'); // 下層暗道無敵星
    enemySpawns.push({ type: "koopa", col: 34, row: 12 });

    digPit(49, 5, ' ');
    fillRect(10, 47, 12, 48, 'S');
    fillRect(10, 54, 12, 57, 'S');
    setTile(7, 55, 't');
    enemySpawns.push({ type: "parakoopa", col: 63, row: 7 });
    fillRect(8, 66, 8, 74, 'B');
    setTile(8, 70, '?');

    // 第二幕（col 78 ~ 124）：深淵礦車軌道與懸空升降梯
    digPit(79, 26, ' ');
    fillRect(10, 80, 12, 84, 'S');
    platformSpawns.push({
      x: 86 * 40, y: 9 * 40, w: 120, h: 16,
      minX: 85 * 40, maxX: 96 * 40, speed: 2.3, dx: 0
    });
    fillRect(8, 99, 12, 104, 'S');
    setTile(5, 101, 't');
    enemySpawns.push({ type: "koopa", col: 109, row: 12 });
    fillRect(7, 112, 7, 120, 'T');
    addCoinArc(113, 5, 5);

    // --- col 132 為中繼存檔旗 ---

    // 第三幕（col 140 ~ 198）：地下熔岩礦脈區（上下雙層路線）
    fillRect(6, 142, 6, 166, 'T'); // 上層高空木橋
    setTile(3, 154, 'M');
    digPit(145, 5, 'L');
    digPit(156, 5, 'L');
    setTile(10, 151, '?');
    enemySpawns.push({ type: "goomba", col: 163, row: 12 });

    fillRect(9, 171, 12, 176, 'S');
    setTile(6, 173, '?'); // 改為金幣磚（或 'M' 道具磚）
    digPit(177, 14, ' ');
    platformSpawns.push({
      x: 179 * 40, y: 8 * 40, w: 120, h: 16,
      minX: 178 * 40, maxX: 188 * 40, speed: 2.5, dx: 0
    });
    fillRect(9, 191, 12, 196, 'S');

    // 第四幕（col 202 ~ 246）：古礦坑出口高台衝刺
    enemySpawns.push({ type: "parakoopa", col: 203, row: 6 });
    fillRect(7, 207, 7, 218, 'B');
    setTile(7, 212, '?');
    enemySpawns.push({ type: "koopa", col: 215, row: 12 });
    fillRect(9,  223, 12, 228, 'S');
    fillRect(7,  231, 7,  238, 'T');
    addCoinArc(232, 5, 5);
    fillRect(10, 240, 12, 244, 'S');
  }

  // =================================================================
  // 【2-5 沙暴巨蟲巢穴】（300 格）：三段式向上攀登神殿＋48 格完整主畫面競技場
  // =================================================================
  else if (lvlNum === 5) {
    // 第一段（col 20 ~ 78）：神殿外牆階梯攀升
    fillRect(11, 22, 12, 25, 'S');
    fillRect(9,  28, 12, 32, 'S');
    setTile(6, 30, 'M');
    enemySpawns.push({ type: "koopa", col: 30, row: 9 });

    fillRect(7, 36, 7, 42, 'B');
    setTile(7, 39, '?');
    digPit(34, 14, 'Q');

    fillRect(5, 46, 5, 53, 'T');
    addCoinArc(47, 3, 5);
    enemySpawns.push({ type: "parakoopa", col: 56, row: 5 });

    fillRect(7,  60, 12, 64, 'S');
    setTile(4, 62, '*');
    fillRect(10, 68, 12, 73, 'S');
    enemySpawns.push({ type: "goomba", col: 70, row: 10 });

    // 第二段（col 82 ~ 126）：雙層垂直遺跡塔
    digPit(82, 24, 'L');
    fillRect(10, 84, 10, 90, 'S');
    fillRect(7,  93, 7, 100, 'S');
    setTile(4, 96, 'M');
    platformSpawns.push({
      x: 102 * 40, y: 6 * 40, w: 120, h: 16,
      minX: 102 * 40, maxX: 112 * 40, speed: 2.5, dx: 0
    });
    fillRect(5, 116, 5, 124, 'B');
    setTile(5, 120, '?');
    enemySpawns.push({ type: "parakoopa", col: 118, row: 4 });

    // 第三段（col 136 ~ 225）：天際懸空石柱群
    digPit(136, 36, 'Q');
    fillRect(9, 139, 12, 142, 'S');
    fillRect(6, 147, 12, 150, 'S');
    fillRect(4, 155, 12, 159, 'S');
    addCoinArc(155, 2, 5);
    setTile(1, 157, 'M');

    platformSpawns.push({
      x: 162 * 40, y: 5 * 40, w: 120, h: 16,
      minX: 162 * 40, maxX: 172 * 40, speed: 2.8, dx: 0
    });
    fillRect(7, 177, 12, 182, 'S');
    enemySpawns.push({ type: "parakoopa", col: 186, row: 6 });
    fillRect(10, 190, 12, 196, 'S');
  }

  // =================================================================
  // 中繼存檔旗 ('R') 與 終點區域
  // =================================================================
  if (!cfg.isBossStage) {
    let cp = cfg.checkpointCol;
    fillRect(13, cp - 3, 14, cp + 3, 'G');
    setTile(12, cp, 'R');
    setTile(11, cp, 'R');

    let flagCol = cols - 15;
    fillRect(13, flagCol - 6, 14, cols - 1, 'G');
    for (let step = 0; step < 5; step++) {
      fillRect(12 - step, flagCol - 6 + step, 12, flagCol - 2, 'S');
    }
    setTile(3, flagCol, '|');
    for (let r = 4; r <= 12; r++) setTile(r, flagCol, 'F');
    fillRect(8, flagCol + 5, 12, flagCol + 9, 'C');
  } else {
    let cp = cfg.checkpointCol;
    fillRect(13, cp - 3, 14, cp + 3, 'G');
    setTile(12, cp, 'R');
    setTile(11, cp, 'R');

    let arenaStart = cols - 58;
    fillRect(1, arenaStart - 12, 12, arenaStart - 1, ' ');
    fillRect(0, arenaStart - 12, 0, cols - 1, 'G');
    fillRect(13, arenaStart - 12, 14, cols - 1, 'G');

    setTile(12, arenaStart - 7, 'R');
    setTile(11, arenaStart - 7, 'R');
    setTile(9, arenaStart - 5, '?');
    setTile(9, arenaStart - 4, 'M');

    fillRect(1, arenaStart, 12, cols - 1, ' ');
    fillRect(9, arenaStart + 4, 9, arenaStart + 9, 'S');
    fillRect(6, arenaStart + 11, 6, arenaStart + 15, 'S');
    fillRect(9, cols - 19, 9, cols - 14, 'S');
    fillRect(6, cols - 25, 6, cols - 21, 'S');

    fillRect(1, cols - 3, 12, cols - 1, 'G');
    fillRect(9, cols - 4, 12, cols - 2, 'C');
  }

  return {
    config: cfg,
    mapStrings: grid.map(row => row.join('')),
    enemySpawns,
    platformSpawns
  };
}

// =====================================================================
// 2-1 神秘流沙吸入口進入的「地下 20 秒秘室」（終點為紅色秘密終點旗 'H'）
// =====================================================================
function buildWorld2SubSecretMap() {
  let rows = 15;
  let cols = 72;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  let enemySpawns = [];

  const setTile = (r, c, ch) => { if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch; };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) setTile(r, c, ch);
  };

  fillRect(0, 0, 0, cols - 1, 'B');
  fillRect(13, 0, 14, cols - 1, 'G');

  for (let c = 10; c <= 16; c++) setTile(9, c, 'O');
  setTile(9, 13, 'M');
  fillRect(11, 20, 12, 22, 'S');
  fillRect(9, 25, 12, 27, 'S');
  setTile(6, 26, '?');
  enemySpawns.push({ type: "koopa", col: 32, row: 12 });

  fillRect(8, 36, 8, 44, 'B');
  for (let c = 37; c <= 43; c++) setTile(6, c, 'O');
  fillRect(11, 48, 12, 51, 'S');

  let flagCol = 58;
  for (let r = 3; r <= 12; r++) setTile(r, flagCol, 'H');
  fillRect(8, flagCol + 5, 12, flagCol + 9, 'C');

  return {
    mapStrings: grid.map(row => row.join('')),
    enemySpawns
  };
}

// =====================================================================
// 2-4 開場「全亮礦工裝備補給密室」（頭燈＋4 個火把磚＋出口水管 'u'）
// =====================================================================
function buildWorld2MinerSupplyRoom() {
  let rows = 15;
  let cols = 28;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const setTile = (r, c, ch) => { if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch; };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) setTile(r, c, ch);
  };

  fillRect(0, 0, 1, cols - 1, 'B');
  fillRect(13, 0, 14, cols - 1, 'G');
  fillRect(2, 0, 12, 0, 'B');
  fillRect(2, cols - 1, 12, cols - 1, 'B');

  fillRect(2, 2, 3, 3, 'P');
  setTile(8, 6, 't');
  setTile(8, 7, 't');
  setTile(8, 8, 't');
  setTile(8, 9, 't');
  fillRect(12, 12, 12, 13, 'S');
  fillRect(11, 22, 12, 23, 'u');

  return {
    mapStrings: grid.map(row => row.join(''))
  };
}
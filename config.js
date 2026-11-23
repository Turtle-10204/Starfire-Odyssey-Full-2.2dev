// =====================================================================
// config.js — 常數與設定（影格數、碰撞盒、格子大小、道具圖鑑文字）。調整數值平衡請改這裡。
// =====================================================================

const POWERUP_GUIDE_DB = {
  mushroom: {
    title: "超級蘑菇 (Super Mushroom)",
    color: "#E63946",
    desc: [
      "• 體型變大，獲得額外 1 點耐傷護盾！",
      "• 跳躍頂撞「紅磚塊」時可直接將其擊碎。",
      "• 受傷時會縮小回原狀，不會直接損失生命。"
    ]
  },
  fire: {
    title: "火焰花 (Fire Flower)",
    color: "#FF5400",
    desc: [
      "• 攻擊進化為「追蹤彈跳火焰彈」！",
      "• 射出的火球會自動微幅追蹤前方敵人與魔王。",
      "• 命中魔王可造成 3 倍高額傷害！"
    ]
  },
  feather: {
    title: "羽翼披風 (Feather Cape)",
    color: "#FFB703",
    desc: [
      "• 跳躍中再按跳躍鍵，可施展「二段振翅飛升」！",
      "• 每次騰空最多可連續振翅 2 次，輕鬆跨越深淵。",
      "• 滯空時具備緩降滑翔效果，方便精準落點。"
    ]
  },
  speed: {
    title: "疾風加速菇 (Speed Mushroom)",
    color: "#0096C7",
    desc: [
      "• 大幅提升最高奔跑速度與慣性衝刺距離！",
      "• 電腦版按一下 [Ctrl/Shift] 切換衝刺開關；手機版點一下 [DASH] 開啟。",
      "• 滿速衝刺時撞擊敵人可將其撞退並暈眩 3 秒。"
    ]
  },
  cactus: {
    title: "仙人掌刺甲菇 (Cactus Mushroom)",
    color: "#2D6A4F",
    desc: [
      "• 【沙漠專屬】按住蹲下 [↓/S] 展開尖刺護罩，可反殺撞過來的怪物並震碎仙人掌柱！",
      "• 按 [F] 射擊會發射「穿透仙人掌飛針」，可一路貫穿整排敵人。",
      "• 注意：站立或走路碰到怪物仍會受傷喔！"
    ]
  },
  chrono: {
    title: "時光沙漏菇 (Chrono Mushroom)",
    color: "#D97706",
    desc: [
      "• 【時間領域】按一下 [Ctrl/Shift]（手機點 [DASH]）展開廣域緩速場，瞬間震暈周圍敵人並可直接撞飛！",
      "• 【流沙免疫】踩在沙漠流沙坑上完全不下沉，如履平地。",
      "• 【時光倒流】致命墜落或受傷時自動消耗能力回溯至安全位置，免死一次！"
    ]
  },
  star: {
    title: "無敵星星 (Super Star)",
    color: "#FFD166",
    desc: [
      "• 8 秒內進入全彩閃爍無敵狀態！",
      "• 免疫所有怪物、火棒與魔王火球傷害。",
      "• 直接撞擊敵人即可將其撞飛並獲得額外分數！"
    ]
  }
};

// 動畫影格設定
const WALK_FRAME_COUNT = 8; 

const STAND_FRAME_COUNT = 7; 

const JUMP_FRAME_COUNT = 10; 

const JUMP_MOVE_FRAME_COUNT = 23; 

const FALLING_FRAME_COUNT = 3;    

const ATTACK_FRAME_COUNT = 12;   

const SQUAT_FRAME_COUNT = 5;        

const SQUAT_MOVE_FRAME_COUNT = 12;  

const DEAD_FRAME_COUNT = 12;

const BASE_FRAME_INTERVAL = 100;  

const MOVE_SPEED = 4; 

// 地圖系統設定
const TILE_SIZE = 40; 

const BASE_HITBOX_W = 22;

const BASE_HITBOX_H = 46; 

const BIG_HITBOX_W = 28;

const BIG_HITBOX_H = 74;

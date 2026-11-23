// =====================================================================
// state.js — 核心遊戲狀態（主角物理、遊戲流程、道具與實體陣列、計時器）。各模組共用的全域變數集中於此。
// =====================================================================

let characterX = 100;  

let characterY = 100;  

let velocityY = 0; 

let gravity = 0.8; 

let jumpStrength = -20; 

let facingDirection = 1; 

let currentFrame = 0; 

let lastFrameTime = 0; 

let previousAnimation = "stand"; 

let animationState = "stand"; 

// 裝置控制模式 ("PC" | "MOBILE") 與視角縮放設定
let controlMode = "PC";

let viewZoom = 1.0;

let autoFitMobileZoom = true;

let showSettingsModal = false;

let showExitMapConfirmModal = false;

let showItemGuides = true;

let chronoWaveTimer = 0;

let safePositionHistory = [];

// <--- 新增以下變數：2-1 地下秘室 + 2-4 黑暗礦坑火把與頭燈系統
let is2_1SubSecret = false;        // 是否正在 2-1 神秘流沙地下 20 秒秘室中

let quicksandExitMode = false;

let quicksandFadeInTimer = -9999;

// 遊戲畫面與關卡狀態
let gameState = "DEVICE_SELECT"; 

let currentLevel = 1;   

let is1_2Intro = false; 

let stateTimer = 0;     

let castleTargetX = 0;  

let hideCharacter = false; 

let isExitingPipe = false;

let isExitingCeilingPipe = false;

let flagDropY = 0;

let castleFlagRaised = false;

let castleFlagProgress = 0;

let castleRoofTopY = 0;

let levelTimer = 400;

let checkpointState = {
  active: false,
  world: 1,
  level: 1,
  x: 100,
  y: 100
};

let isSecretClear = false;

let lastLevelTimerTick = 0;

// 進關前狀態快照（防止按 M 退出關卡洗道具）
let levelEntrySnapshot = { lives: 3, powerLevel: 1, powerType: "none", reservedItem: null, coinCount: 0, score: 0 };

// 狀態系統變數
let isActionLocked = false; 

let isGliding = false; 

let isOnGround = false; 

let isShortJump = false; 

let featherFlapsLeft = 2;        

let isAttacking = false;         

let hasFiredThisAttack = false;  

let isCrouching = false;         

let prevHitboxH = 46;            

let activeEffects = [];          

// 3層生命力梯度系統 (1 = 一般小隻, 2 = 蘑菇大隻, 3 = 能力強化狀態)
let powerLevel = 1;

let powerType = "none";

let reservedItem = null;         

// 變身/受擊定格閃爍、無敵與無敵星計時器
let transformTimer = 0;          

let transformIsDamage = false;   

let transformFromBig = false;

let transformToBig = false;

let invincibleTimer = 0;         

let starTimer = 0;               

// 死亡動畫狀態（DYING_ANIMATION 聚光燈縮光圈演出）
let deathAnimX = 100;

let deathAnimY = 100;

let deathAnimTimer = 0;

let deathAnimStage = 0;

let deathAnimFinished = false;

// 加速菇衝刺蓄力系統與撞擊反彈
let currentSprintBonus = 0;

let knockbackVX = 0;      

// 生命值與金幣計數系統
let lives = 3;

let coinCount = 0;

let score = 0;

// 場上實體陣列
let items = [];                  

let enemies = [];                

let playerFireballs = [];     

let cactusNeedles = [];

let chronoFieldActive = false;   

let brickParticles = [];         

let coins = []; 

let floatingTexts = []; 

let bumpingTiles = [];           

// 1-3 / 1-4 移動浮空平台系統
let movingPlatforms = [];

let platformCarryDX = 0;

let cameraX = 0;

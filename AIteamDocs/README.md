# Starfire Odyssey

使用 **p5.js** 製作的 2D
橫向捲軸平台跳躍網頁遊戲，支援電腦鍵盤與手機／平板觸控。

## 專案狀態

-   目前基準版本：**2.11（拆檔版）**；下一個開發目標：**2.2**。
-   2.11 是「純拆檔」版本：由 2.1 的 `sketch.js`（約 6,916 行）依功能拆成 19 個檔案，**邏輯未改動**。使用者已實機測試，回報功能保留、無新增 Bug（測試裝置與瀏覽器待補充）。
-   2.1 玩家測試回報：第一關、死亡／復活、手機操作均正常。此為使用者回報，不代表所有關卡與裝置都已測試。
-   2.1 單檔版倉庫僅供歷史對照，不再修改。
-   未經最新程式碼或實機驗證的資訊，一律標示「待確認」。

## 技術概況

-   使用 p5.js；純前端，沒有 npm、打包工具或 ES Modules。
-   JavaScript 透過 `index.html` 的 `<script>`
    依序載入，共用全域作用域。
-   可直接用瀏覽器開啟 `index.html`；若圖片載入失敗，改用本機伺服器。
-   文字與註解以繁體中文為主。

## 遊戲內容

  --------------------------------------------------------------------------------------------------
  世界                    關卡                          說明
  ----------------------- ----------------------------- --------------------------------------------
  World 1 草原            1-1 草原起點、1-2             1-4 為魔王關，通關後轉場前往世界 2
                          地下洞穴（含水管入口）、1-3   
                          黃昏浮島、1-4 熔岩魔王城      

  World 2 沙漠            2-0 岔路、2-SHOP 補給屋、2-1  2-4
                          黃沙綠洲、2-2 無盡流沙海、2-3 解鎖後，魔王關節點會由「2-4」改名為「2-5」
                          太陽神殿、2-4                 
                          幽暗古礦坑（隱藏路線）、2-5   
                          沙暴巨蟲巢穴                  
  --------------------------------------------------------------------------------------------------

道具：超級蘑菇、火焰花、羽翼披風、疾風加速菇、仙人掌刺甲菇、時光沙漏菇、無敵星星、1UP。擊敗沙暴巨蟲可解鎖第二位角色「沙漠遊俠」。

## 操作

  功能                 電腦           手機
  -------------------- -------------- --------------------
  移動                 方向鍵／A、D   虛擬方向鍵
  跳躍                 空白鍵／W／↑   JUMP
  蹲下                 ↓／S           ▼
  射擊                 F              FIRE
  加速／時間領域開關   Ctrl／Shift    DASH（點一下鎖定）
  空投備用道具         B              點上方道具框
  插火把（僅 2-4）     E 或 T         點火把框
  切換角色（解鎖後）   C              ---
  返回大地圖           M              右上角「地圖」
  設定                 O              右上角「設定」
  大地圖道具箱         I              Items 按鈕

其他按鍵（如 1、2、U、P、R）請查看 `keyPressed()`；用途待確認。

## 檔案結構（2.11 拆檔版）

```
index.html            依序載入所有腳本（載入順序很重要）
style.css  jsconfig.json
libraries/            p5.min.js、p5.sound.min.js
action/  new/         角色精靈圖與特效素材（PNG 橫向影格條）
AIteamDocs/           團隊文件（README、PROJECT_CONTEXT、GAME_DESIGN、BUG_TRACKER、CHANGELOG、AI_TEAM_RULES、HANDOFF）
world_maps.js         世界 2 關卡地圖生成器
config.js             常數：影格數、碰撞盒、TILE_SIZE、道具圖鑑文字（POWERUP_GUIDE_DB）
state.js              核心共用狀態（主角物理、遊戲流程、實體陣列、計時器）
assets.js             圖片載入、精靈圖量測、材質包（preload、measureSpriteMetrics、buildTexturePack）
audio.js              8-bit 音效與 BGM（initAudioEngine、playTone、playSFX、updateBGM）
maps_world1.js        世界 1 地圖字串、flagCol、loadLevelMap
level_tiles.js        碰撞、磚塊、水管、旗桿、移動平台、地圖繪製（checkCollision、drawMap 等）
entities.js           敵人、道具、金幣、浮動文字
player.js             受傷／死亡、時光倒流、火球、仙人掌飛針
boss_castle.js        1-4 魔王城：火棒、魔王、斧頭、橋崩塌
world2_miner.js       2-4 礦坑：頭燈、火把、黑暗遮罩、補給室狀態（saved2_4MainState）
world2_sandworm.js    2-5 沙暴巨蟲 BOSS 與救出新角色過場
world2_atmosphere.js  世界 2 背景與地標
ui_hud.js             HUD、角色頭像、道具圖示
ui_modals.js          彈窗：道具圖鑑、設定、離開確認、沙漠補給屋
ui_screens.js         裝置選擇、關卡開場、Game Over
ui_worldmap.js        大地圖節點（mapNodesData）、繪製、游標、進入關卡
input.js              鍵盤、觸控、虛擬按鍵、點擊分派（keyPressed、handlePointerTap）
level_flow.js         startLevel、exitToWorldMapRestoreEntry
sketch.js             p5 入口：setup() 與 draw() 主迴圈（draw 約 1,260 行）
```

### 載入順序（index.html 已排好）

`world_maps.js` → `config.js` → `state.js` → `assets.js` → `audio.js` → `maps_world1.js` → 玩法模組（`level_tiles`、`entities`、`player`、`boss_castle`、`world2_*`）→ UI 與輸入（`ui_*`、`input.js`）→ `level_flow.js` → **`sketch.js`（永遠最後）**。

函式可跨檔案互相呼叫（執行期才解析）；順序只影響檔案最上層 `let`／`const` 的初始化。新增檔案時要同步更新 `index.html` 與本節。

### 高風險共用區

`state.js`、`config.js`、`sketch.js` 的 `draw()`、`level_tiles.js` 的 `checkCollision()`（只回傳有無碰撞，不分方向，沒有單向平台概念）、`input.js` 的 `handlePointerTap()`／`keyPressed()`、`index.html`。修改前須先經審查。

> 行號：2.11 各檔案的行號與 2.1 單檔版不同，文件中不再記載行號，請以檔名＋函式名稱定位。

## 架構重點

-   共用全域作用域，沒有類別或模組封裝。
-   關卡識別用 `currentWorld`（1／2）與 `currentLevel`（1～5）。不可只用
    `currentLevel === 4` 判斷世界 1 魔王城或世界 2 礦坑，兩邊都是 4。
-   地圖是字串陣列，每個字元代表一種磚塊或物件，字元意義要查 `level_tiles.js` 的 `drawMap()`
    與 `checkCollision()`。
-   精靈圖是每個動作一張橫向影格條，影格數定義在 `config.js` 的
    `*_FRAME_COUNT`，換圖時要同步確認。
-   大地圖節點資料在 `mapNodesData`，節點含
    `unlocked`、`cleared`、`nextNormal`、`nextSecret`、`neighbors`。
-   解鎖的新角色「沙漠遊俠」目前是程式繪製（非精靈圖），由
    `activeCharacterId` 切換。

### gameState 狀態機

目前出現的狀態：

`DEVICE_SELECT`、`WORLD_MAP`、`LEVEL_INTRO`、`PLAYING`、`ITEM_GUIDE`、`TRANSFORM_FREEZE`、`FLAG_SLIDE`、`WALK_TO_CASTLE`、`ENTERING_PIPE`、`ENTERING_SUPPLY_PIPE`、`EXITING_SUPPLY_PIPE`、`ENTERING_QUICKSAND`、`BOSS_DEFEAT_CUTSCENE`、`ALL_CLEAR`、`GAME_OVER`。

新增或修改狀態時，必須檢查 `draw()` 內所有相關判斷，以及
`keyPressed()`、`handlePointerTap()` 的按鍵與點擊分派。

## 已知問題（Claude 於 2.11 靜態確認程式碼存在，尚未實機重現）

詳細記錄見 `BUG_TRACKER.md`。修改前仍須重新檢查最新程式碼並嘗試重現。

1.  **補給室返回可能當機**：`sketch.js` 的 `draw()` 在 `ENTERING_SUPPLY_PIPE` 處理把 `saved2_4MainState` 存成 `{map, x, y}`；`EXITING_SUPPLY_PIPE` 處理卻讀 `.mapStrings`、`.platformSpawns`、`.enemySpawns`。`level_flow.js` 的 `startLevel` 存的才是完整格式。可能導致 `loadLevelMap(undefined)`。
2.  **BGM 與部分地磚／材質只看 `currentLevel === 4`**：`audio.js`（`updateBGM`）、`level_tiles.js`（`drawMap`）。（魔王與火棒在 `startLevel` 會重設，影響較小。）
3.  `sketch.js` 的 `draw()` 內 `isExitingPipe` 處理出現兩段；另有一段使用不存在的 `"PIPE_ENTER"`／`"PIPE_EXIT"`，實際狀態是 `ENTERING_PIPE`。
4.  `sketch.js` 的 `FLAG_SLIDE` 區塊中 `let flagCol` 遮蔽 `maps_world1.js` 的全域 `flagCol`。
5.  `ui_hud.js` 的電腦版底部提示 `1-${currentLevel}` 寫死世界 1，世界 2 會顯示錯誤。

## 開發與測試守則

完整規則見 `AI_TEAM_RULES.md`，以下為摘要：

-   不要改成 `import`／`export` 或加入打包工具，除非整個專案明確決定遷移。
-   不要隨意重新命名全域函式或變數；改名前先全專案搜尋。
-   `preload()`、`setup()`、`draw()` 只能各定義一次。
-   新增全域變數：單一模組用的放該檔開頭，跨模組共用的放 `state.js`，常數放 `config.js`。
-   交付方式：檔案不大時交付整個檔案；較大的檔案（例如 `sketch.js`）交付整個函式的替換版本，並標明檔名與函式名稱。
-   同一時間只有一個 AI 修改同一個檔案；每次修改都要在 `HANDOFF.md` 留下交接摘要。
-   修改後依範圍做回歸測試；至少保留開始畫面、大地圖、1-1、道具、通關、1-2 水管、手機虛擬按鍵、世界 2 補給屋與 2-4 水管。
-   iOS Safari 音訊需要使用者互動後才能啟動（見 `initAudioEngine`）。
-   完成後更新 `CHANGELOG.md`、`BUG_TRACKER.md`。

# BUG_TRACKER --- Starfire Odyssey

## 狀態定義

-   待確認：只有文件或推論記載，尚未重新檢查。
-   已重現：依記錄步驟可穩定重現。
-   修復中：已有修正方案，尚未完成。
-   待回歸測試：程式已修改，尚未由測試確認。
-   已關閉：修復後通過相關回歸測試。

## 2.11 已知問題

以下問題由 Claude 在 2.11 拆檔版以靜態檢查確認「程式碼存在」，**尚未實機重現**，因此狀態仍為待確認。位置以 2.11 的檔名與函式為準。

### BUG-001：2-4 補給室返回可能當機

-   狀態：待確認（靜態確認程式碼存在，尚未實機重現）
-   位置：`sketch.js` 的 `draw()` 中 `ENTERING_SUPPLY_PIPE`（存入 `saved2_4MainState = {map, x, y}`）與 `EXITING_SUPPLY_PIPE`（讀取 `.mapStrings`、`.platformSpawns`、`.enemySpawns`）；`level_flow.js` 的 `startLevel` 存的才是完整格式；變數宣告在 `world2_miner.js`。
-   描述：從 2-4 中途水管進入補給室再離開，還原時讀不到地圖資料，可能導致 `loadLevelMap(undefined)` 報錯。
-   建議驗證：進入 2-4，從中途水管進補給室再離開，確認地圖、平台、敵人與玩家狀態恢復。

### BUG-002：世界 2 的 2-4 可能誤用世界 1 魔王城設定

-   狀態：待確認（影響範圍已縮小）
-   位置：`audio.js` 的 `updateBGM`（`currentLevel === 4` 分支）；`level_tiles.js` 的 `drawMap`（地磚顏色與 `G_CASTLE` 材質判斷）。
-   描述：只看 `currentLevel === 4`，世界 2 的 2-4 可能套用世界 1 魔王城的 BGM 或地磚。魔王、火棒等邏輯在 `startLevel` 會重設，Claude 判斷影響較小。
-   建議驗證：分別進入 1-4 與 2-4，比較 BGM 與地磚設定。

### BUG-003：水管離開判斷重複或狀態名稱不一致

-   狀態：待確認
-   位置：`sketch.js` 的 `draw()`：`isExitingPipe` 處理出現兩段；另有 `"PIPE_ENTER"`／`"PIPE_EXIT"` 判斷，實際狀態是 `ENTERING_PIPE`。
-   建議驗證：搜尋相關狀態字串並追蹤水管進出流程，確認兩段處理是否真的重複。

### BUG-004：`flagCol` 區域變數遮蔽全域變數

-   狀態：待確認
-   位置：`sketch.js` 的 `FLAG_SLIDE` 區塊內 `let flagCol`；全域 `flagCol` 宣告在 `maps_world1.js`。
-   建議驗證：檢查作用域與旗桿動畫期間變數讀寫。

### BUG-005：世界 2 的電腦版 HUD 關卡文字錯誤

-   狀態：待確認
-   位置：`ui_hud.js` 的 `drawNSMBHUD`，電腦版底部提示 `1-${currentLevel}` 寫死世界 1。
-   建議驗證：用電腦版進入世界 2 不同關卡，確認底部提示的世界與關卡編號。

## 2.2 新增測試問題

新的 2.2 需求在測試中發現問題時，依序新增
BUG-006、BUG-007......。每筆記錄： - 發現版本： - 裝置／瀏覽器： -
重現步驟： - 預期結果： - 實際結果： - 相關函式／程式區段： -
修正內容： - 回歸測試：

# CHANGELOG --- Starfire Odyssey

只記錄已確認完成或使用者回報的事項。計畫中的功能放在
`PROJECT_CONTEXT.md`，不可提前標示為已完成。

## 2.11 --- 2026-11-22（目前基準版本）

-   基準 commit／分支：由 2.1 單檔版拆出，上傳為獨立倉庫 Starfire-Odyssey-Full-2.11Ver。
-   新增：19 個功能模組檔案（`config.js`、`state.js`、`assets.js`、`audio.js`、`maps_world1.js`、`level_tiles.js`、`entities.js`、`player.js`、`boss_castle.js`、`world2_miner.js`、`world2_sandworm.js`、`world2_atmosphere.js`、`ui_hud.js`、`ui_modals.js`、`ui_screens.js`、`ui_worldmap.js`、`input.js`、`level_flow.js`、`sketch.js`）與 `AIteamDocs/` 團隊文件。
-   修改：`index.html` 改為依序載入各模組，`sketch.js` 最後載入。
-   修復：無（純拆檔，未修改任何邏輯，BUG-001～005 仍存在）。
-   影響檔案／函式：原 `sketch.js` 全部內容；各函式只是搬移，內容不變。
-   Claude 靜態檢查：新檔案與原 `sketch.js` 逐行比對，無遺失或新增；各檔案語法檢查通過；在模擬環境依 `index.html` 順序載入，與原版無差異（這不是真實瀏覽器測試）。
-   測試裝置與瀏覽器：待使用者補充。
-   測試結果：使用者回報實機測試，功能保留、無新增 Bug。
-   尚未解決：BUG-001～005。
-   回退方式：改回 2.1 單檔版倉庫。

## 2.1

### 使用者回報測試

-   第一關：正常。
-   死亡／復活：正常。
-   手機操作：正常。

### 專案基準

-   單檔版：`sketch.js`（約 6,916 行）、`world_maps.js` 與相關 HTML、CSS、素材。

## 2.2 --- 規劃中

尚未在本文件標示任何 2.2 功能已完成。

規劃方向： - 仙人掌受傷、防護罩與提示修正。 - 單階段 Boss 戰與 Boss
房優化。 - 所有角色加入抓牆與蹬牆跳。 - 手機操作配置與 Boss 血條改善。 -
流沙關卡、角色、材質、敵人與道具提示更新。 - 沙漏菇時緩與震暈效果調整。

## 更新紀錄格式

### \[版本\] --- YYYY-MM-DD

-   基準 commit／分支：
-   新增：
-   修改：
-   修復：
-   影響檔案／函式：
-   測試裝置與瀏覽器：
-   測試結果：
-   尚未解決：
-   回退方式：

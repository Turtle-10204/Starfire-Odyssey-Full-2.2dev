// =====================================================================
// level_tiles.js — 地形：碰撞、磚塊/問號磚、水管、旗桿、移動平台、地圖繪製。
// =====================================================================

function addBumpTile(r, c) {
  bumpingTiles.push({ r: r, c: c, offsetY: -10 });
}

function updateBumpingTiles() {
  for (let i = bumpingTiles.length - 1; i >= 0; i--) {
    bumpingTiles[i].offsetY += 1.5;
    if (bumpingTiles[i].offsetY >= 0) {
      bumpingTiles.splice(i, 1);
    }
  }
}

function getTileBumpOffset(r, c) {
  for (let bt of bumpingTiles) {
    if (bt.r === r && bt.c === c) return bt.offsetY;
  }
  return 0;
}

function checkLavaHazard(cx, cy, cw, ch) {
  let left = cx - cw / 2 + 4;
  let right = cx + cw / 2 - 4;
  let bottom = cy + ch / 2;
  let startCol = floor(left / TILE_SIZE);
  let endCol = floor(right / TILE_SIZE);
  let row = floor(bottom / TILE_SIZE);

  if (row >= 0 && row < levelMap.length) {
    for (let c = startCol; c <= endCol; c++) {
      if (c >= 0 && c < levelMap[0].length && levelMap[row][c] === 'L') {
        return true;
      }
    }
  }
  return false;
}

function updateMovingPlatforms() {
  for (let mp of movingPlatforms) {
    let oldX = mp.x;
    mp.x += mp.speed;
    if (mp.x <= mp.minX) {
      mp.x = mp.minX;
      mp.speed *= -1;
    } else if (mp.x >= mp.maxX) {
      mp.x = mp.maxX;
      mp.speed *= -1;
    }
    mp.dx = mp.x - oldX;
  }
}

function drawMovingPlatforms() {
  for (let mp of movingPlatforms) {
    fill(currentLevel === 4 ? "#8D99AE" : "#E07A5F");
    stroke("#2B2D42");
    strokeWeight(2);
    rect(mp.x, mp.y, mp.w, mp.h, 4);
    fill(currentLevel === 4 ? "#EDF2F4" : "#F2CC8F");
    noStroke();
    rect(mp.x + 4, mp.y + 3, mp.w - 8, 5, 2);
  }
}

function checkEnterPipe(cx, cy, cw, ch) {
  let rightEdge = cx + cw / 2 + 4;
  let col = floor(rightEdge / TILE_SIZE);
  let row = floor(cy / TILE_SIZE);

  if (row >= 0 && row < levelMap.length && col >= 0 && col < levelMap[0].length) {
    if (levelMap[row][col] === 'H') {
      gameState = "ENTERING_PIPE";
      stateTimer = millis();
      isAttacking = false;
      isCrouching = false;
      playSFX("shrink");
    }
  }
}

function checkHiddenBlockHit(hitX, hitY) {
  let col = floor(hitX / TILE_SIZE);
  let row = floor(hitY / TILE_SIZE);

  if (row >= 0 && row < levelMap.length && col >= 0 && col < levelMap[0].length) {
    if (levelMap[row][col] === 'I') {
      levelMap[row][col] = 'E';
      addBumpTile(row, col);
      addCoinAndScore(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE);
      return true;
    }
  }
  return false;
}

function checkHitTile(hitX, hitY) {
  let col = floor(hitX / TILE_SIZE);
  let row = floor(hitY / TILE_SIZE);

  if (row >= 0 && row < levelMap.length && col >= 0 && col < levelMap[0].length) {
    let tile = levelMap[row][col];
    
    if (tile === '?') {
      levelMap[row][col] = 'E'; 
      addBumpTile(row, col);
      addCoinAndScore(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE);
    } else if (tile === 'M' || tile === '*') {
      levelMap[row][col] = 'E';
      addBumpTile(row, col);
      spawnPowerupFromBlock(tile, col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE - TILE_SIZE / 2);
    } else if (tile === 't') {
      levelMap[row][col] = 'E';
      addBumpTile(row, col);
      torchCount += 16;
      playSFX("powerup");
      floatingTexts.push({ text: "獲得 16 根火把！", x: col * TILE_SIZE - 30, y: row * TILE_SIZE - 20, vy: -1.5, life: 70, isOneUp: true });
    } else if (tile === 'B') {
      if (powerLevel >= 2) {
        levelMap[row][col] = ' ';
        score += 50;
        playSFX("brick");
        spawnBrickParticles(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
      } else {
        addBumpTile(row, col);
        playSFX("stomp");
      }
    }
  }
}

function spawnBrickParticles(bx, by) {
  let dirs = [[-3, -8], [3, -8], [-2, -5], [2, -5]];
  for (let d of dirs) {
    brickParticles.push({
      x: bx,
      y: by,
      vx: d[0],
      vy: d[1],
      life: 40
    });
  }
}

function updateAndDrawBrickParticles() {
  for (let i = brickParticles.length - 1; i >= 0; i--) {
    let p = brickParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.5;
    p.life--;

    fill((currentLevel === 2 && !is1_2Intro) ? "#3b6e8c" : (currentLevel === 4 ? "#6c757d" : "#A33B20"));
    rect(p.x - 6, p.y - 6, 12, 12);

    if (p.life <= 0) {
      brickParticles.splice(i, 1);
    }
  }
}

function checkFlagpole(cx, cy, cw, ch) {
  // 1. 偵測 World 2 中繼存檔旗 ('R')：首次觸碰啟動存檔點＋紅蘑菇變大效果！
  let pCol = floor(cx / TILE_SIZE);
  let pRow = floor(cy / TILE_SIZE);
  for (let r = pRow - 1; r <= pRow + 1; r++) {
    for (let c = pCol - 1; c <= pCol + 1; c++) {
      if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
        if (levelMap[r][c] === 'R') {
          // 把這根存檔旗標記為已啟動（改成 'r' 小寫）
          for (let fr = 0; fr < levelMap.length; fr++) {
            if (levelMap[fr][c] === 'R') levelMap[fr][c] = 'r';
          }
          checkpointState = {
            active: true,
            world: currentWorld,
            level: currentLevel,
            x: c * TILE_SIZE + TILE_SIZE / 2,
            y: (r - 1) * TILE_SIZE
          };
          playSFX("powerup");
          floatingTexts.push({ text: "CHECKPOINT!", x: c * TILE_SIZE - 30, y: r * TILE_SIZE - 45, vy: -1.5, life: 90, isOneUp: true });

          // 首次吃到中繼旗會有紅蘑菇變大效果（若目前是 1 階小隻就升級為 2 階大隻）
          if (powerLevel === 1) {
            transformFromBig = false;
            transformToBig = true;
            powerLevel = 2;
            powerType = "mushroom";
            gameState = "TRANSFORM_FREEZE";
            transformTimer = 500;
            transformIsDamage = false;
          }
        }

        // 2. 偵測 2-1 隱藏高空秘密終點旗杆 ('H'，僅在 currentWorld === 2 時)
        if (currentWorld === 2 && levelMap[r][c] === 'H') {
          isSecretClear = true;
          playSFX("1up");
          score += 10000;
          floatingTexts.push({ text: "SECRET GOAL! +10000", x: c * TILE_SIZE - 50, y: r * TILE_SIZE - 30, vy: -1.5, life: 120, isOneUp: true });

          // 先把主角貼齊旗杆並進入滑旗狀態，而非直接吸向城堡
          characterX = c * TILE_SIZE + TILE_SIZE / 2;
          velocityY = 0;
          isGliding = false;
          isAttacking = false;
          isCrouching = false;
          gameState = "FLAG_SLIDE";

          // 自動尋找右邊城堡 'C' 的正中央，滑到底後再走進去
          let minCastleCol = 9999;
          let maxCastleCol = -1;
          for (let cr = 0; cr < levelMap.length; cr++) {
            for (let cc = c + 1; cc < levelMap[cr].length; cc++) {
              if (levelMap[cr][cc] === 'C') {
                minCastleCol = min(minCastleCol, cc);
                maxCastleCol = max(maxCastleCol, cc);
              }
            }
          }
          if (maxCastleCol !== -1) {
            castleTargetX = ((minCastleCol + maxCastleCol + 1) / 2) * TILE_SIZE;
          } else {
            castleTargetX = (c + 7.5) * TILE_SIZE;
          }
          return;
        }
      }
    }
  }
  if (flagCol === -1 || gameState !== "PLAYING") return;

  let topFlagRow = 3;
  let bottomFlagRow = 11;
  for (let r = 0; r < levelMap.length; r++) {
    if (levelMap[r][flagCol] === '|' || levelMap[r][flagCol] === 'F') {
      topFlagRow = r;
      break;
    }
  }
  for (let r = topFlagRow; r < levelMap.length; r++) {
    if (levelMap[r][flagCol] === '|' || levelMap[r][flagCol] === 'F') {
      bottomFlagRow = r;
    }
  }
  let poleTopY = topFlagRow * TILE_SIZE - 8;
  let poleBottomY = (bottomFlagRow + 1) * TILE_SIZE;
  if (cy + ch / 2 < poleTopY || cy - ch / 2 > poleBottomY) return;

  let flagX = flagCol * TILE_SIZE + TILE_SIZE / 2;
  if (cx + cw / 2 >= flagX - 6) {
    characterX = flagX;
    velocityY = 0;
    isGliding = false;
    isAttacking = false;
    isCrouching = false;
    gameState = "FLAG_SLIDE";
    playSFX("clear");

    let grabRow = floor(cy / TILE_SIZE);
    let earnedPoints = 200;
    if (grabRow <= 3) {
      earnedPoints = 10000; 
      triggerOneUp(flagX + 25, cy - 30);
    } else if (grabRow === 4) {
      earnedPoints = 8000;
    } else if (grabRow === 5) {
      earnedPoints = 4000;
    } else if (grabRow === 6) {
      earnedPoints = 2000;
    } else if (grabRow === 7) {
      earnedPoints = 1000;
    } else if (grabRow === 8) {
      earnedPoints = 800;
    } else if (grabRow === 9 || grabRow === 10) {
      earnedPoints = 400;
    } else {
      earnedPoints = 200;
    }

    score += earnedPoints;

    floatingTexts.push({
      text: "+" + earnedPoints,
      x: flagX + 25,
      y: cy,
      vy: -1.5,
      life: 120 
    });

    let minCastleCol = 9999;
    let maxCastleCol = -1;
    for (let r = 0; r < levelMap.length; r++) {
      for (let c = flagCol + 1; c < levelMap[r].length; c++) {
        if (levelMap[r][c] === 'C') {
          minCastleCol = min(minCastleCol, c);
          maxCastleCol = max(maxCastleCol, c);
        }
      }
    }
    if (maxCastleCol !== -1) {
      castleTargetX = ((minCastleCol + maxCastleCol + 1) / 2) * TILE_SIZE;
    } else {
      castleTargetX = flagX + 8 * TILE_SIZE;
    }
  }
}

function drawPipesOnly() {
  push();
  imageMode(CORNER);
  for (let row = 0; row < levelMap.length; row++) {
    for (let col = 0; col < levelMap[row].length; col++) {
      let tile = levelMap[row][col];
      if (tile === 'P' || tile === 'p' || tile === 'u' || tile === 'V' ) {
        let isCeilingPipe = (row >= 2 && levelMap[0][col] === 'B' && levelMap[1][col] === 'B' && levelMap[2][col] === tile);
        let isMouth = isCeilingPipe
          ? (row === levelMap.length - 1 || levelMap[row + 1][col] !== tile)
          : (row === 0 || levelMap[row - 1][col] !== tile);
        image(isMouth ? textures["PIPE_TOP"] : textures["PIPE"], col * TILE_SIZE, row * TILE_SIZE);
      } else if (tile === 'H') {
        // 如果上方也是 'H'，代表已經由上一排一起畫成整根大橫管了，跳過避免重複切斷
        if (row > 0 && levelMap[row - 1][col] === 'H') continue;

        let isDoubleH = (row + 1 < levelMap.length && levelMap[row + 1][col] === 'H');
        let pipeHHeight = isDoubleH ? TILE_SIZE * 2 : TILE_SIZE;
        let isLeftMouth = (col === 0 || levelMap[row][col - 1] !== 'H');
        let px = col * TILE_SIZE;
        let py = row * TILE_SIZE - 6; // 往上多包 6px，確保高個子主角頭頂也完全進管不露餡
        let ph = pipeHHeight + 6;

        noStroke();
        // 管身主色（不透明實心綠，徹底封死不漏風）
        fill("#1B7F3A");
        rect(px, py, TILE_SIZE, ph);
        // 高光條紋
        fill("#2EC4B6");
        rect(px, py + 5, TILE_SIZE, 6);
        fill("#80ED99");
        rect(px, py + 15, TILE_SIZE, 14);
        // 底部陰影
        fill("#134E27");
        rect(px, py + ph - 10, TILE_SIZE, 10);

        // 最左側管口加厚凸緣框
        if (isLeftMouth) {
          fill("#0D3B1E");
          rect(px - 2, py - 3, 12, ph + 6, 2);
          fill("#1B7F3A");
          rect(px, py - 1, 8, ph + 2);
          fill("#80ED99");
          rect(px + 2, py + 12, 4, 18);
        }
      }
    }
  }
  pop();
}

function drawMap(viewWorldW = width) {
  let isUnderground = (currentLevel === 2 && !is1_2Intro);
  push();
  imageMode(CORNER);

  for (let row = 0; row < levelMap.length; row++) {
    for (let col = 0; col < levelMap[row].length; col++) {
      let tile = levelMap[row][col];
      let tileX = col * TILE_SIZE;
      let tileY = row * TILE_SIZE + getTileBumpOffset(row, col);

      if (tileX + TILE_SIZE > cameraX && tileX < cameraX + viewWorldW) {
        if (tile === 'V') {
          noStroke();
          fill("#B07D3B"); // 深沙褐色底（與一般流沙呼應但略深，帶神秘感）
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          fill("#8C5A1E"); // 暗沙漩渦波紋
          let wave = sin(frameCount * 0.12 + col) * 6;
          ellipse(tileX + 20 + wave, tileY + 8, 28, 7);
          ellipse(tileX + 20 - wave, tileY + 24, 22, 6);
          continue;
        }
        if (tile === 'Q') {
          noStroke();
          fill("#D4A373");
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          fill("#FAEDCD");
          let wave = sin(frameCount * 0.12 + col) * 4;
          ellipse(tileX + 12 + wave, tileY + 8, 16, 6);
          ellipse(tileX + 28 - wave, tileY + 22, 18, 6);
          continue;
        }
        if (tile === 'K') {
          noStroke();
          fill("#2D6A4F");
          rect(tileX + 10, tileY + 2, 20, TILE_SIZE - 2, 8);
          rect(tileX + 2, tileY + 12, 8, 12, 4);
          rect(tileX + 30, tileY + 8, 8, 12, 4);

          // 仙人掌主幹直紋脊線（保留經典仙人掌辨識度）
          fill("#1B4332");
          rect(tileX + 15, tileY + 6, 2, TILE_SIZE - 9, 1);
          rect(tileX + 23, tileY + 6, 2, TILE_SIZE - 9, 1);

          let spikePulse = sin(frameCount * 0.15 + col * 0.5 + row * 0.3);
          let spikeAlpha = map(spikePulse, -1, 1, 120, 255);

          // 細長俐落的純白高光刺針（無外暈、不長頂角，貼合仙人掌輪廓）
          fill(255, 253, 240, spikeAlpha);
          // 主幹左側刺針
          triangle(tileX + 10, tileY + 7, tileX + 5, tileY + 8.5, tileX + 10, tileY + 10);
          triangle(tileX + 10, tileY + 28, tileX + 5, tileY + 29.5, tileX + 10, tileY + 31);
          // 主幹右側刺針
          triangle(tileX + 30, tileY + 5, tileX + 35, tileY + 6.5, tileX + 30, tileY + 8);
          triangle(tileX + 30, tileY + 24, tileX + 35, tileY + 25.5, tileX + 30, tileY + 27);
          // 左右手腕外側刺針
          triangle(tileX + 2, tileY + 16.5, tileX - 3, tileY + 18, tileX + 2, tileY + 19.5);
          triangle(tileX + 38, tileY + 12.5, tileX + 43, tileY + 14, tileX + 38, tileY + 15.5);

          // 柱身表面小刺針高光點（加強整體刺感）
          fill(255, 243, 176, spikeAlpha);
          triangle(tileX + 14, tileY + 13, tileX + 12, tileY + 14, tileX + 14, tileY + 15);
          triangle(tileX + 26, tileY + 19, tileX + 28, tileY + 20, tileX + 26, tileY + 21);

          if (row > 0 && levelMap[row - 1][col] !== 'K') {
            let flowerAlpha = map(spikePulse, -1, 1, 200, 255);
            fill(230, 57, 70, flowerAlpha);
            ellipse(tileX + 20, tileY + 2, 10, 8);
          }
          continue;
        }
        if (tile === 'R' || tile === 'r') {
          stroke("#FFFFFF");
          strokeWeight(4);
          line(tileX + 20, tileY, tileX + 20, tileY + TILE_SIZE);
          noStroke();
          if (row > 0 && levelMap[row - 1][col] !== 'R' && levelMap[row - 1][col] !== 'r') {
            fill(tile === 'r' ? "#38B000" : "#F77F00");
            triangle(tileX + 22, tileY + 2, tileX + 46, tileY + 12, tileX + 22, tileY + 22);
          }
          continue;
        }
        if (tile === 'W') {
          noStroke();
          fill("#FFFFFF");
          rect(tileX, tileY + 4, TILE_SIZE, 22, 10);
          ellipse(tileX + 10, tileY + 6, 20, 16);
          ellipse(tileX + 28, tileY + 6, 22, 18);
          continue;
        }
        if (currentWorld === 2 && (tile === 'G' || tile === 'S')) {
          stroke("#9C6644");
          strokeWeight(2);
          fill(tile === 'G' ? "#E6CCB2" : "#DDB892");
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE, 3);
          noStroke();
          fill("#B08968");
          rect(tileX + 6, tileY + 6, 10, 6, 2);
          continue;
        }
        if (tile === 'G') {
          let tex = textures["G_DAY"];
          if (currentLevel === 4) tex = textures["G_CASTLE"];
          else if (currentLevel === 3) tex = textures["G_SKY"];
          else if (isUnderground) tex = textures["G_UNDER"];
          image(tex, tileX, tileY);
        } else if (tile === 'B') {
          image(textures["BRICK"], tileX, tileY);
        } else if (tile === '?' || tile === 'M' || tile === '*' || tile === 't') {
       image(textures["QBOX"], tileX, tileY);
       if (floor(frameCount / 15) % 2 === 0) {
         noStroke();
         fill(255, 255, 220, 75);
         rect(tileX + 3, tileY + 3, TILE_SIZE - 6, TILE_SIZE - 6, 3);
       }
        } else if (tile === 'E') {
          image(textures["EMPTY"], tileX, tileY);
          } else if (tile === 'O') {
          let spinW = max(5, abs(cos(frameCount * 0.08 + col * 0.5)) * 18);
          fill("#FFD166");
          stroke("#B8860B");
          strokeWeight(2);
          ellipse(tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2, spinW, 24);
          noStroke();
        } else if (tile === 'T') {
          fill("#C87D4B");
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE * 0.45);
          fill("#8D5524");
          rect(tileX, tileY + TILE_SIZE * 0.45, TILE_SIZE, TILE_SIZE * 0.55);
        } else if (tile === 'D') {
          fill("#D4A373");
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE * 0.4);
          fill("#6C757D");
          rect(tileX + 6, tileY + TILE_SIZE * 0.4, TILE_SIZE - 12, TILE_SIZE * 0.3);
        } else if (tile === 'L') {
          noStroke();
          fill("#FF2A00");
          rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          fill("#FF9E00");
          let wave = sin(frameCount * 0.1 + col) * 4;
          rect(tileX, tileY + 4 + wave, TILE_SIZE, 8);
        } else if (tile === 'A') {
          noStroke();
          fill("#ADB5BD");
          rect(tileX + 18, tileY + 6, 4, 28);
          fill("#FFD700");
          arc(tileX + 20, tileY + 14, 24, 18, -HALF_PI, HALF_PI);
       } else if (tile === 'P' || tile === 'p' || tile === 'u') {
          let isCeilingPipe = (row >= 2 && levelMap[0][col] === 'B' && levelMap[1][col] === 'B' && levelMap[2][col] === tile);
          let isMouth = isCeilingPipe
            ? (row === levelMap.length - 1 || levelMap[row + 1][col] !== tile)
            : (row === 0 || levelMap[row - 1][col] !== tile);
          image(isMouth ? textures["PIPE_TOP"] : textures["PIPE"], tileX, tileY);
        } else if (tile === 'H') {
          if (currentWorld === 2) {
            stroke("#FFD166");
            strokeWeight(5);
            line(tileX + 20, tileY, tileX + 20, tileY + TILE_SIZE);
            noStroke();
            if (row > 0 && levelMap[row - 1][col] !== 'H') {
              fill("#E63946");
              let fy = tileY + flagDropY;
              triangle(tileX + 22, fy + 2, tileX + 52, fy + 14, tileX + 22, fy + 26);
            }
            continue;
          }
        if (!(row > 0 && levelMap[row - 1][col] === 'H')) {
          let isDoubleH = (row + 1 < levelMap.length && levelMap[row + 1][col] === 'H');
          let pipeHHeight = isDoubleH ? TILE_SIZE * 2 : TILE_SIZE;
          let isLeftMouth = (col === 0 || levelMap[row][col - 1] !== 'H');
          let px = tileX;
          let py = tileY - 6;
          let ph = pipeHHeight + 6;

          noStroke();
          fill("#1B7F3A");
          rect(px, py, TILE_SIZE, ph);
          fill("#2EC4B6");
          rect(px, py + 5, TILE_SIZE, 6);
          fill("#80ED99");
          rect(px, py + 15, TILE_SIZE, 14);
          fill("#134E27");
          rect(px, py + ph - 10, TILE_SIZE, 10);

          if (isLeftMouth) {
            fill("#0D3B1E");
            rect(px - 2, py - 3, 12, ph + 6, 2);
            fill("#1B7F3A");
            rect(px, py - 1, 8, ph + 2);
            fill("#80ED99");
            rect(px + 2, py + 12, 4, 18);
          }
        }
        } else if (tile === 'S') {
          image(textures["STAIR"], tileX, tileY);
        } else if (tile === 'F') {
          noStroke();
          fill("#FFFFFF");
          rect(tileX + TILE_SIZE / 2 - 4, tileY, 8, TILE_SIZE);
        } else if (tile === '|') {
        noStroke();
        fill("#FFFFFF");
        rect(tileX + TILE_SIZE / 2 - 4, tileY, 8, TILE_SIZE);
        if (row === 0 || (levelMap[row - 1][col] !== '|' && levelMap[row - 1][col] !== 'F')) {
          fill("#2ECC71");
          let fy = tileY + flagDropY;
          triangle(tileX + TILE_SIZE / 2 - 4, fy, tileX + TILE_SIZE / 2 - 36, fy + 15, tileX + TILE_SIZE / 2 - 4, fy + 30);
        }
      } else if (tile === 'C') {
          let isTop = (row === 0 || levelMap[row - 1][col] !== 'C');
          let isBottom = (row === levelMap.length - 1 || levelMap[row + 1][col] !== 'C');
          let isLeftEdge = (col === 0 || levelMap[row][col - 1] !== 'C');
          let isRightEdge = (col === levelMap[row].length - 1 || levelMap[row][col + 1] !== 'C');
          let isCenterDoor = (isBottom && !isLeftEdge && !isRightEdge &&
                              levelMap[row][col - 1] === 'C' && levelMap[row][col + 1] === 'C');


          if (isTop) {
            image(textures["CASTLE_TOP"], tileX, tileY);
          } else if (isCenterDoor) {
            image(textures["CASTLE_DOOR"], tileX, tileY);
          } else {
            image(textures["CASTLE_WALL"], tileX, tileY);
            // 中層左右兩側自動加裝飾小拱窗
            if (!isBottom && (isLeftEdge || isRightEdge)) {
              fill("#1A0505");
              rect(tileX + 13, tileY + 10, 14, 20, 7, 7, 0, 0);
            }
          }
        }
      }
    }
  }
  pop();
}

function checkCollision(cx, cy, cw, ch) {
  let left = cx - cw / 2;
  let right = cx + cw / 2;
  let top = cy - ch / 2;
  let bottom = cy + ch / 2; 

  let startCol = floor(left / TILE_SIZE);
  let endCol = floor(right / TILE_SIZE);
  let startRow = floor(top / TILE_SIZE);
  let endRow = floor(bottom / TILE_SIZE);

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r >= 0 && r < levelMap.length && c >= 0 && c < levelMap[0].length) {
        let tile = levelMap[r][c];
        if (tile !== ' ' && tile !== 'I' && tile !== 'A' && tile !== 'L' && tile !== 'F' && tile !== '|' && tile !== 'C' && tile !== 'O'  && tile !== 'Q' && tile !== 'V' && tile !== 'K' && tile !== 'R' && tile !== 'r' && !(currentWorld === 2 && tile === 'H')) { 
          return true; 
        }
      }
    }
  }
  return false;
}

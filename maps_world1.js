// =====================================================================
// maps_world1.js — 世界 1 的關卡地圖字串與 loadLevelMap。（世界 2 地圖在 world_maps.js）
// =====================================================================

const MAP_1_1 = [
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                            III                  |                  ",
  "                                                                                BBBBBBBB   BBB?                                                                                                  F                  ",
  "                      ?          OOO                                                                                                                       BB?B           II                     F                  ",
  "            B?BMB                                                                  *                                  BMB                                                                        F                  ",
  "                                                                                                                                                       S  SS      BB      I                      F        CCC       ",
  "                                    PP                                                                                                                SS  SSS                                    F       CCCCC      ",
  "                            PP      PP      PP                      ?               ?  ?  ?     B         BB         B   B              P            SSS  SSSS             P                     F       CCCCC      ",
  "                    PP      PP      PP      PP                                                                                         PP           SSSS  SSSSS           PP         BB?B        F       CCCCC      ",
  "                    PP      PP      PP      PP                                                                                        PPP          SSSSS  SSSSSS         PPP                     S       CCCCC      ",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
];

const MAP_1_2_INTRO = [
  "                              ",
  "                              ",
  "                              ",
  "                              ",
  "                              ",
  "                              ",
  "                              ",
  "                              ",
  "                    PP        ",
  "                    PP        ",
  "                    PP        ",
  "                  HHPP        ",
  "                  HHPP        ",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
];

const MAP_1_2 = [
  "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                 |                  ",
  "                                                                    BBBBBB           BBBBBB                                        BBBBBBBBBBBB                                                  F                  ",
  "               OOO                                                  B    B           B    B                                                                                                      F                  ",
  "                                                                    B ?M B           B ?? B               BBBB      BBBB                                                                         F                  ",
  "            ?????                                                   B    B           B    B                                 *                                     SS                             F                  ",
  "                                                                    BBBBBB           BBBBBB                                                                      SSS         I                   F        CCC       ",
  "                                           PP                                                                       PP                    PP                    SSSS                             F       CCCCC      ",
  "                                 PP        PP                                                       BB?B            PP                    PP                   SSSSS         P                   F       CCCCC      ",
  "                       PP        PP        PP                                                                       PP                    PP                  SSSSSS        PP                   F       CCCCC      ",
  "             S         PP        PP        PP                                                                       PP                    PP                 SSSSSSS       PPP                   S       CCCCC      ",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
];

const MAP_1_3 = [
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                                    ",
  "                                                                                                                                                                                                 |                  ",
  "                         OOO                                                         ?                                                                                                           F                  ",
  "                                          TTTTT                                                                                                                                TTTTTT            F                  ",
  "                        TTTT                                                      BBBBBBB                                     TTTTT                                                              F                  ",
  "                                                                                                                                                                     TTTT                        F                  ",
  "            B?MB                  TTTTT               TTTTTTT                                            TTTTTT                                           SS                                     F        CCC       ",
  "                                                                               BBBBBBBBBBBBB                                                             SSS                                     F       CCCCC      ",
  "                                                                                                                                                        SSSS                                     F       CCCCC      ",
  "                                                                                                   TTTT                                                SSSSS                                     F       CCCCC      ",
  "                                                                               TTTTTTTTTTTTT                                                          SSSSSS                                     S       CCCCC      ",
  "GGGGGGGGGGGGGGGGGG                                                                                                                               GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGG                                                                                                                               GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
];

const MAP_1_4 = [
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "G                                                                                                                                                                                                                  G",
  "G                                                                                                                                                                                                                  G",
  "G                                                                                                                                                                                                                  G",
  "G                                                                                                                                                                                                                  G",
  "                OOO                                 BBBBBBBBBBB                                                                                                                                                    G",
  "G                     ?                             B         B                                                                                                                                                    G",
  "G                                                   B   ?M?   B                                                                                 BBBBBBBB                                                           G",
  "G         B?MB                                      B         B                                                                                 B      B                                                           G",
  "G                                                   BBBBBBBBBBB                                     GGGGGGGGGG                                  B   I  B                                       A                   G",
  "G                                                                              GGG                  G        G                                                                                 S                   G",
  "G                        S                                                                          G        G                                                         DDDDDDDDDDDDDDDDDDDDDDDDD     CCCCCCCC      G",
  "G                       SS                                              E                           G        G                                                         G                       G     C      C      G",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGLLLLLLLLLLLLLLLLLLLLLLLGGGGGGGGGGGGGGGGGGG"
];

let levelMap = [];

let flagCol = -1; 

let nextPowerCycle = 0;

function loadLevelMap(sourceMap) {
  flagDropY = 0;
  levelMap = [];
  flagCol = -1;
  bridgeTiles = [];
  for (let r = 0; r < sourceMap.length; r++) {
    let rowArr = sourceMap[r].split('');
    for (let c = 0; c < rowArr.length; c++) {
      if (rowArr[c] === '|' || rowArr[c] === 'F') {
        flagCol = c;
      }
      if (rowArr[c] === 'D') {
        bridgeTiles.push({ r: r, c: c });
      }
    }
    levelMap.push(rowArr);
  }
  bridgeTiles.sort((a, b) => b.c - a.c);
}

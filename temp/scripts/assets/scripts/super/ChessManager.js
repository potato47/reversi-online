"use strict";
cc._RFpush(module, 'fd23biEYxBN7IoWrlheRQaR', 'ChessManager');
// scripts\super\ChessManager.js

var Constants = require('Constants');
var CHESS_TYPE = Constants.CHESS_TYPE;
var STAND = Constants.STAND;
var GAME_STATE = Constants.GAME_STATE;
cc.Class({
    'extends': cc.Component,

    properties: {
        COL: 8,
        ROW: 8,
        chessPrefab: cc.Prefab,
        chesses: []
    },

    // use this for initialization
    onLoad: function onLoad() {
        G.chessManager = this;
        this.chessWidth = this.node.width / this.COL;
        for (var x = 0; x < this.COL; x++) {
            this.chesses[x] = [];
            for (var y = 0; y < this.ROW; y++) {
                var chessNode = cc.instantiate(this.chessPrefab);
                chessNode.parent = this.node;
                chessNode.width = this.chessWidth - 5;
                chessNode.height = this.chessWidth - 5;
                chessNode.position = cc.p(this.chessWidth / 2 + x * this.chessWidth, this.chessWidth / 2 + y * this.chessWidth);
                var chess = chessNode.getComponent('Chess');
                chess.coor = cc.p(x, y);
                this.chesses[x][y] = chess;
                this.addTouchEvent(chess);
            }
        }
        this.chesses[3][3].type = CHESS_TYPE.BLACK;
        this.chesses[3][4].type = CHESS_TYPE.WHITE;
        this.chesses[4][4].type = CHESS_TYPE.BLACK;
        this.chesses[4][3].type = CHESS_TYPE.WHITE;
        G.gameManager.startGame();
        var self = this;
        G.roomSocket.on('update chessboard', function (chessCoor) {
            self.fallChess(self.chesses[chessCoor.x][chessCoor.y]);
        });
        G.roomSocket.on('change turn', function () {
            G.gameManager.changeTurn();
        });
        G.roomSocket.on('force change turn', function () {
            G.gameManager.forceChangeTurn();
        });
    },

    addTouchEvent: function addTouchEvent(chess) {
        var self = this;
        chess.node.on('touchend', function (e) {
            if (G.gameManager.gameState === GAME_STATE.PLAYING && G.gameManager.turn === G.stand) {
                if (chess.type === CHESS_TYPE.NONE) {
                    for (var dir = 1; dir <= 8; dir++) {
                        if (self.judgePass(G.gameManager.turn, chess, dir)) {
                            self.fallChess(chess);
                            G.roomSocket.emit('update chessboard', chess.coor);
                            break;
                        }
                        if (dir === 8) {
                            return;
                        }
                    }
                }
            }
        });
    },

    fallChess: function fallChess(chess) {
        if (G.gameManager.turn === STAND.BLACK) {
            chess.type = CHESS_TYPE.BLACK;
        } else if (G.gameManager.turn === STAND.WHITE) {
            chess.type = CHESS_TYPE.WHITE;
        }
        for (var dir = 1; dir <= 8; dir++) {
            if (this.judgePass(G.gameManager.turn, chess, dir)) {
                this.changePass(chess, dir);
            }
        }
        G.gameManager.updateScore();
        G.gameManager.changeTurn();
        this.judgeWin();
    },

    nearChess: function nearChess(chess, dir) {
        switch (dir) {
            case 1:
                //left
                if (chess.coor.x !== 0) {
                    return this.chesses[chess.coor.x - 1][chess.coor.y];
                }
                break;
            case 2:
                //left up
                if (chess.coor.x !== 0 && chess.coor.y !== this.ROW - 1) {
                    return this.chesses[chess.coor.x - 1][chess.coor.y + 1];
                }
                break;
            case 3:
                //up
                if (chess.coor.y !== this.ROW - 1) {
                    return this.chesses[chess.coor.x][chess.coor.y + 1];
                }
                break;
            case 4:
                //right up
                if (chess.coor.x !== this.COL - 1 && chess.coor.y !== this.ROW - 1) {
                    return this.chesses[chess.coor.x + 1][chess.coor.y + 1];
                }
                break;
            case 5:
                //right
                if (chess.coor.x !== this.COL - 1) {
                    return this.chesses[chess.coor.x + 1][chess.coor.y];
                }
                break;
            case 6:
                //right down
                if (chess.coor.x !== this.COL - 1 && chess.coor.y !== 0) {
                    return this.chesses[chess.coor.x + 1][chess.coor.y - 1];
                }
                break;
            case 7:
                //down
                if (chess.coor.y !== 0) {
                    return this.chesses[chess.coor.x][chess.coor.y - 1];
                }
                break;
            case 8:
                //left down
                if (chess.coor.x !== 0 && chess.coor.y !== 0) {
                    return this.chesses[chess.coor.x - 1][chess.coor.y - 1];
                }
                break;

            default:
                break;
        }
        return null;
    },

    judgePass: function judgePass(stand, chess, dir) {
        var tempChess = chess;
        tempChess = this.nearChess(chess, dir);
        if (tempChess === null) {
            return false;
        }
        while (tempChess.type === -stand) {
            tempChess = this.nearChess(tempChess, dir);
            if (tempChess === null) {
                return false;
            }
            if (tempChess.type == stand) {
                return true;
            }
        }
        return false;
    },

    changePass: function changePass(chess, dir) {
        var tempChess = this.nearChess(chess, dir);
        while (tempChess.type === -G.gameManager.turn) {
            tempChess.type = chess.type;
            tempChess = this.nearChess(tempChess, dir);
        }
    },

    judgeMoveAble: function judgeMoveAble(stand) {
        //判断stand是否有可落子的地方
        var tryChess = null;
        for (var x = 0; x < this.COL; x++) {
            for (var y = 0; y < this.ROW; y++) {
                tryChess = this.chesses[x][y];
                if (tryChess.type === CHESS_TYPE.NONE) {
                    for (var dir = 1; dir <= 8; dir++) {
                        if (this.judgePass(stand, tryChess, dir)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },

    judgeWin: function judgeWin() {
        var selfMoveAble = this.judgeMoveAble(G.gameManager.turn);
        var oppoMoveAble = this.judgeMoveAble(-G.gameManager.trun);
        if (selfMoveAble) {
            return;
        } else if (!selfMoveAble && oppoMoveAble) {
            cc.log('can not move next turn');
            G.gameManager.forceChangeTurn();
            G.roomSocket.emit('force change turn');
        } else if (!selfMoveAble && !oppoMoveAble) {
            cc.log('both can not move someone win');
            G.gameManager.endGame();
        }
    },

    getChessCount: function getChessCount() {
        var blackChess = 0;
        var whiteChess = 0;
        for (var x = 0; x < this.chesses.length; x++) {
            for (var y = 0; y < this.chesses[x].length; y++) {
                if (this.chesses[x][y].type === CHESS_TYPE.BLACK) {
                    blackChess++;
                } else if (this.chesses[x][y].type === CHESS_TYPE.WHITE) {
                    whiteChess++;
                }
            }
        }
        return [blackChess, whiteChess];
    }
});

cc._RFpop();
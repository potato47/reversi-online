require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"ChessManager":[function(require,module,exports){
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
},{"Constants":"Constants"}],"Chess":[function(require,module,exports){
"use strict";
cc._RFpush(module, '038ecKdx7hAFbMdQrCbLy4q', 'Chess');
// scripts\cell\Chess.js

var Constants = require('Constants');
var CHESS_TYPE = Constants.CHESS_TYPE;
cc.Class({
    'extends': cc.Component,

    properties: {
        pics: {
            'default': [],
            type: [cc.SpriteFrame]
        },
        _type: CHESS_TYPE.NONE,
        type: {
            get: function get() {
                return this._type;
            },
            set: function set(value) {
                this._type = value;
                if (value === CHESS_TYPE.BLACK) {
                    this.getComponent(cc.Sprite).spriteFrame = this.pics[0];
                } else if (value === CHESS_TYPE.WHITE) {
                    this.getComponent(cc.Sprite).spriteFrame = this.pics[1];
                } else {
                    this.getComponent(cc.Sprite).spriteFrame = null;
                }
            }
        },
        coor: cc.p(0, 0), //坐标
        chance: 0 //周围可翻转棋子的可能性
    },

    onLoad: function onLoad() {
        this.type = CHESS_TYPE.NONE;
    }

});

cc._RFpop();
},{"Constants":"Constants"}],"Constants":[function(require,module,exports){
"use strict";
cc._RFpush(module, '12eb7dOVPtKGbYm/iRgXp8a', 'Constants');
// scripts\util\Constants.js

var STAND = cc.Enum({
    BLACK: 47,
    WHITE: -47
});

var CHESS_TYPE = cc.Enum({
    NONE: -1,
    BLACK: 47,
    WHITE: -47
});

var GAME_STATE = cc.Enum({
    PREPARE: -1,
    PLAYING: -1,
    OVER: -1
});

var DIR = cc.Enum({
    LEFT: -1,
    LEFT_UP: -1,
    UP: -1,
    RIGHT_UP: -1,
    RIGHT: -1,
    RIGHT_DOWN: -1,
    DOWN: -1,
    LEFT_DOWN: -1
});

module.exports = {
    STAND: STAND,
    CHESS_TYPE: CHESS_TYPE,
    GAME_STATE: GAME_STATE,
    DIR: DIR
};

cc._RFpop();
},{}],"GameManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'e993eESIzFLR5rQMdFCiYnH', 'GameManager');
// scripts\super\GameManager.js

var Constants = require('Constants');
var GAME_STATE = Constants.GAME_STATE;
var STAND = Constants.STAND;
var CHESS_TYPE = Constants.CHESS_TYPE;
cc.Class({
    'extends': cc.Component,

    properties: {
        gameState: {
            'default': GAME_STATE.PREPARE,
            type: GAME_STATE
        },
        turn: {
            'default': STAND.BLACK,
            type: STAND
        },
        blackScoreLabel: cc.Label,
        whiteScoreLabel: cc.Label,
        infoPanel: cc.Node,
        infoLabel: cc.Label
    },

    // use this for initialization
    onLoad: function onLoad() {
        G.gameManager = this;
        this.infoAnimation = this.infoPanel.getComponent(cc.Animation);
    },

    startGame: function startGame() {
        this.turn = STAND.BLACK;
        this.gameState = GAME_STATE.PLAYING;
        this.showInfo('start game');
    },

    endGame: function endGame() {
        var onFinished = function onFinished() {
            G.roomSocket.disconnect();
            cc.director.loadScene('menu');
        };
        this.infoAnimation.on('finished', onFinished, this);
        this.gameState = GAME_STATE.OVER;
        this.showInfo('game over');
    },

    changeTurn: function changeTurn() {
        if (this.turn === STAND.BLACK) {
            this.turn = STAND.WHITE;
        } else if (this.turn === STAND.WHITE) {
            this.turn = STAND.BLACK;
        }
    },

    forceChangeTurn: function forceChangeTurn() {
        //无子可下换边
        this.showInfo('force change turn');
        this.changeTurn();
    },

    updateScore: function updateScore() {
        var chessCount = G.chessManager.getChessCount();
        var blackChess = chessCount[0];
        var whiteChess = chessCount[1];
        this.blackScoreLabel.string = blackChess + '';
        this.whiteScoreLabel.string = whiteChess + '';
    },

    showInfo: function showInfo(type) {
        var chessCount = G.chessManager.getChessCount();
        var blackChess = chessCount[0];
        var whiteChess = chessCount[1];
        if (type === 'start game') {
            if (G.stand === STAND.BLACK) {
                this.infoLabel.string = '你是蓝色方\n执黑棋先手';
            } else if (G.stand === STAND.WHITE) {
                this.infoLabel.string = '你是红色方\n执白棋后手';
            }
        } else if (type === 'game over') {
            if (blackChess > whiteChess) {
                this.infoLabel.string = '游戏结束\n黑棋胜';
            } else if (blackChess < whiteChess) {
                this.infoLabel.string = '游戏结束\n白棋胜';
            } else if (blackChess === whiteChess) {
                this.infoLabel.string = '游戏结束\n平局';
            }
        } else if (type === 'force change turn') {
            if (G.stand === STAND.BLACK) {
                this.infoLabel.string = '黑方无子可下\n请白方下子';
            } else if (G.stand === STAND.WHITE) {
                this.infoLabel.string = '白方无子可下\n请黑方下子';
            }
        }
        this.infoAnimation.play();
    }

});

cc._RFpop();
},{"Constants":"Constants"}],"Global":[function(require,module,exports){
"use strict";
cc._RFpush(module, '04fd0MxwapHrYsfCAT2HRS8', 'Global');
// scripts\util\Global.js

window.G = {
    globalSocket: null, //全局
    hallSocket: null, //大厅
    queueSocket: null, //队列
    roomSocket: null, //房间
    gameManager: null,
    chessManager: null,
    stand: null
};

cc._RFpop();
},{}],"MatchManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6737dPBUENHLazdKLnt/lX8', 'MatchManager');
// scripts\super\MatchManager.js

var Constants = require('Constants');
var STAND = Constants.STAND;
cc.Class({
    'extends': cc.Component,

    onLoad: function onLoad() {
        G.queueSocket = io.connect('127.0.0.1:4747/queue', { 'force new connection': true });
        G.queueSocket.on('set stand', function (stand) {
            if (stand === 'black') {
                G.stand = STAND.BLACK;
            } else if (stand === 'white') {
                G.stand = STAND.WHITE;
            }
        });
        G.queueSocket.on('match success', function (roomId) {
            cc.log('match success' + roomId);
            G.roomSocket = io.connect('127.0.0.1:4747/rooms' + roomId, { 'force new connection': true });
            G.queueSocket.disconnect();
            cc.director.loadScene('game');
        });
    },

    onBtnCancel: function onBtnCancel() {
        G.queueSocket.disconnect();
        cc.director.loadScene('menu');
    }
});

cc._RFpop();
},{"Constants":"Constants"}],"MenuManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'dbed4TWiO9G8rOPLhxoyUSx', 'MenuManager');
// scripts\super\MenuManager.js

cc.Class({
    'extends': cc.Component,

    onLoad: function onLoad() {
        G.globalSocket = io.connect('127.0.0.1:4747');
        //断开连接后再重新连接需要加上{'force new connection': true}
        G.hallSocket = io.connect('127.0.0.1:4747/hall', { 'force new connection': true });
    },

    onBtnStart: function onBtnStart() {
        G.hallSocket.disconnect();
        cc.director.loadScene('match');
    }
});

cc._RFpop();
},{}]},{},["Chess","Global","Constants","MatchManager","MenuManager","GameManager","ChessManager"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6L0NvY29zQ3JlYXRvci9yZXNvdXJjZXMvYXBwLmFzYXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFzc2V0cy9zY3JpcHRzL3N1cGVyL0NoZXNzTWFuYWdlci5qcyIsImFzc2V0cy9zY3JpcHRzL2NlbGwvQ2hlc3MuanMiLCJhc3NldHMvc2NyaXB0cy91dGlsL0NvbnN0YW50cy5qcyIsImFzc2V0cy9zY3JpcHRzL3N1cGVyL0dhbWVNYW5hZ2VyLmpzIiwiYXNzZXRzL3NjcmlwdHMvdXRpbC9HbG9iYWwuanMiLCJhc3NldHMvc2NyaXB0cy9zdXBlci9NYXRjaE1hbmFnZXIuanMiLCJhc3NldHMvc2NyaXB0cy9zdXBlci9NZW51TWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2ZkMjNiaUVZeEJON0lvV3JsaGVSUWFSJywgJ0NoZXNzTWFuYWdlcicpO1xuLy8gc2NyaXB0c1xcc3VwZXJcXENoZXNzTWFuYWdlci5qc1xuXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnQ29uc3RhbnRzJyk7XG52YXIgQ0hFU1NfVFlQRSA9IENvbnN0YW50cy5DSEVTU19UWVBFO1xudmFyIFNUQU5EID0gQ29uc3RhbnRzLlNUQU5EO1xudmFyIEdBTUVfU1RBVEUgPSBDb25zdGFudHMuR0FNRV9TVEFURTtcbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgQ09MOiA4LFxuICAgICAgICBST1c6IDgsXG4gICAgICAgIGNoZXNzUHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIGNoZXNzZXM6IFtdXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICBHLmNoZXNzTWFuYWdlciA9IHRoaXM7XG4gICAgICAgIHRoaXMuY2hlc3NXaWR0aCA9IHRoaXMubm9kZS53aWR0aCAvIHRoaXMuQ09MO1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuQ09MOyB4KyspIHtcbiAgICAgICAgICAgIHRoaXMuY2hlc3Nlc1t4XSA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCB0aGlzLlJPVzsgeSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoZXNzTm9kZSA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2hlc3NQcmVmYWIpO1xuICAgICAgICAgICAgICAgIGNoZXNzTm9kZS5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgICAgICAgICAgY2hlc3NOb2RlLndpZHRoID0gdGhpcy5jaGVzc1dpZHRoIC0gNTtcbiAgICAgICAgICAgICAgICBjaGVzc05vZGUuaGVpZ2h0ID0gdGhpcy5jaGVzc1dpZHRoIC0gNTtcbiAgICAgICAgICAgICAgICBjaGVzc05vZGUucG9zaXRpb24gPSBjYy5wKHRoaXMuY2hlc3NXaWR0aCAvIDIgKyB4ICogdGhpcy5jaGVzc1dpZHRoLCB0aGlzLmNoZXNzV2lkdGggLyAyICsgeSAqIHRoaXMuY2hlc3NXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmFyIGNoZXNzID0gY2hlc3NOb2RlLmdldENvbXBvbmVudCgnQ2hlc3MnKTtcbiAgICAgICAgICAgICAgICBjaGVzcy5jb29yID0gY2MucCh4LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZXNzZXNbeF1beV0gPSBjaGVzcztcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFRvdWNoRXZlbnQoY2hlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hlc3Nlc1szXVszXS50eXBlID0gQ0hFU1NfVFlQRS5CTEFDSztcbiAgICAgICAgdGhpcy5jaGVzc2VzWzNdWzRdLnR5cGUgPSBDSEVTU19UWVBFLldISVRFO1xuICAgICAgICB0aGlzLmNoZXNzZXNbNF1bNF0udHlwZSA9IENIRVNTX1RZUEUuQkxBQ0s7XG4gICAgICAgIHRoaXMuY2hlc3Nlc1s0XVszXS50eXBlID0gQ0hFU1NfVFlQRS5XSElURTtcbiAgICAgICAgRy5nYW1lTWFuYWdlci5zdGFydEdhbWUoKTtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBHLnJvb21Tb2NrZXQub24oJ3VwZGF0ZSBjaGVzc2JvYXJkJywgZnVuY3Rpb24gKGNoZXNzQ29vcikge1xuICAgICAgICAgICAgc2VsZi5mYWxsQ2hlc3Moc2VsZi5jaGVzc2VzW2NoZXNzQ29vci54XVtjaGVzc0Nvb3IueV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgRy5yb29tU29ja2V0Lm9uKCdjaGFuZ2UgdHVybicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEcuZ2FtZU1hbmFnZXIuY2hhbmdlVHVybigpO1xuICAgICAgICB9KTtcbiAgICAgICAgRy5yb29tU29ja2V0Lm9uKCdmb3JjZSBjaGFuZ2UgdHVybicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEcuZ2FtZU1hbmFnZXIuZm9yY2VDaGFuZ2VUdXJuKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhZGRUb3VjaEV2ZW50OiBmdW5jdGlvbiBhZGRUb3VjaEV2ZW50KGNoZXNzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgY2hlc3Mubm9kZS5vbigndG91Y2hlbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKEcuZ2FtZU1hbmFnZXIuZ2FtZVN0YXRlID09PSBHQU1FX1NUQVRFLlBMQVlJTkcgJiYgRy5nYW1lTWFuYWdlci50dXJuID09PSBHLnN0YW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLnR5cGUgPT09IENIRVNTX1RZUEUuTk9ORSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBkaXIgPSAxOyBkaXIgPD0gODsgZGlyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmp1ZGdlUGFzcyhHLmdhbWVNYW5hZ2VyLnR1cm4sIGNoZXNzLCBkaXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mYWxsQ2hlc3MoY2hlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEcucm9vbVNvY2tldC5lbWl0KCd1cGRhdGUgY2hlc3Nib2FyZCcsIGNoZXNzLmNvb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpciA9PT0gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGZhbGxDaGVzczogZnVuY3Rpb24gZmFsbENoZXNzKGNoZXNzKSB7XG4gICAgICAgIGlmIChHLmdhbWVNYW5hZ2VyLnR1cm4gPT09IFNUQU5ELkJMQUNLKSB7XG4gICAgICAgICAgICBjaGVzcy50eXBlID0gQ0hFU1NfVFlQRS5CTEFDSztcbiAgICAgICAgfSBlbHNlIGlmIChHLmdhbWVNYW5hZ2VyLnR1cm4gPT09IFNUQU5ELldISVRFKSB7XG4gICAgICAgICAgICBjaGVzcy50eXBlID0gQ0hFU1NfVFlQRS5XSElURTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBkaXIgPSAxOyBkaXIgPD0gODsgZGlyKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmp1ZGdlUGFzcyhHLmdhbWVNYW5hZ2VyLnR1cm4sIGNoZXNzLCBkaXIpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VQYXNzKGNoZXNzLCBkaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIEcuZ2FtZU1hbmFnZXIudXBkYXRlU2NvcmUoKTtcbiAgICAgICAgRy5nYW1lTWFuYWdlci5jaGFuZ2VUdXJuKCk7XG4gICAgICAgIHRoaXMuanVkZ2VXaW4oKTtcbiAgICB9LFxuXG4gICAgbmVhckNoZXNzOiBmdW5jdGlvbiBuZWFyQ2hlc3MoY2hlc3MsIGRpcikge1xuICAgICAgICBzd2l0Y2ggKGRpcikge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIC8vbGVmdFxuICAgICAgICAgICAgICAgIGlmIChjaGVzcy5jb29yLnggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2hlc3Nlc1tjaGVzcy5jb29yLnggLSAxXVtjaGVzcy5jb29yLnldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAvL2xlZnQgdXBcbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci54ICE9PSAwICYmIGNoZXNzLmNvb3IueSAhPT0gdGhpcy5ST1cgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54IC0gMV1bY2hlc3MuY29vci55ICsgMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIC8vdXBcbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci55ICE9PSB0aGlzLlJPVyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2hlc3Nlc1tjaGVzcy5jb29yLnhdW2NoZXNzLmNvb3IueSArIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAvL3JpZ2h0IHVwXG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLmNvb3IueCAhPT0gdGhpcy5DT0wgLSAxICYmIGNoZXNzLmNvb3IueSAhPT0gdGhpcy5ST1cgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54ICsgMV1bY2hlc3MuY29vci55ICsgMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgIC8vcmlnaHRcbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci54ICE9PSB0aGlzLkNPTCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2hlc3Nlc1tjaGVzcy5jb29yLnggKyAxXVtjaGVzcy5jb29yLnldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAvL3JpZ2h0IGRvd25cbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci54ICE9PSB0aGlzLkNPTCAtIDEgJiYgY2hlc3MuY29vci55ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54ICsgMV1bY2hlc3MuY29vci55IC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgICAgIC8vZG93blxuICAgICAgICAgICAgICAgIGlmIChjaGVzcy5jb29yLnkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2hlc3Nlc1tjaGVzcy5jb29yLnhdW2NoZXNzLmNvb3IueSAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgICAgICAvL2xlZnQgZG93blxuICAgICAgICAgICAgICAgIGlmIChjaGVzcy5jb29yLnggIT09IDAgJiYgY2hlc3MuY29vci55ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54IC0gMV1bY2hlc3MuY29vci55IC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICBqdWRnZVBhc3M6IGZ1bmN0aW9uIGp1ZGdlUGFzcyhzdGFuZCwgY2hlc3MsIGRpcikge1xuICAgICAgICB2YXIgdGVtcENoZXNzID0gY2hlc3M7XG4gICAgICAgIHRlbXBDaGVzcyA9IHRoaXMubmVhckNoZXNzKGNoZXNzLCBkaXIpO1xuICAgICAgICBpZiAodGVtcENoZXNzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHRlbXBDaGVzcy50eXBlID09PSAtc3RhbmQpIHtcbiAgICAgICAgICAgIHRlbXBDaGVzcyA9IHRoaXMubmVhckNoZXNzKHRlbXBDaGVzcywgZGlyKTtcbiAgICAgICAgICAgIGlmICh0ZW1wQ2hlc3MgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGVtcENoZXNzLnR5cGUgPT0gc3RhbmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGNoYW5nZVBhc3M6IGZ1bmN0aW9uIGNoYW5nZVBhc3MoY2hlc3MsIGRpcikge1xuICAgICAgICB2YXIgdGVtcENoZXNzID0gdGhpcy5uZWFyQ2hlc3MoY2hlc3MsIGRpcik7XG4gICAgICAgIHdoaWxlICh0ZW1wQ2hlc3MudHlwZSA9PT0gLUcuZ2FtZU1hbmFnZXIudHVybikge1xuICAgICAgICAgICAgdGVtcENoZXNzLnR5cGUgPSBjaGVzcy50eXBlO1xuICAgICAgICAgICAgdGVtcENoZXNzID0gdGhpcy5uZWFyQ2hlc3ModGVtcENoZXNzLCBkaXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGp1ZGdlTW92ZUFibGU6IGZ1bmN0aW9uIGp1ZGdlTW92ZUFibGUoc3RhbmQpIHtcbiAgICAgICAgLy/liKTmlq1zdGFuZOaYr+WQpuacieWPr+iQveWtkOeahOWcsOaWuVxuICAgICAgICB2YXIgdHJ5Q2hlc3MgPSBudWxsO1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuQ09MOyB4KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgdGhpcy5ST1c7IHkrKykge1xuICAgICAgICAgICAgICAgIHRyeUNoZXNzID0gdGhpcy5jaGVzc2VzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmICh0cnlDaGVzcy50eXBlID09PSBDSEVTU19UWVBFLk5PTkUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZGlyID0gMTsgZGlyIDw9IDg7IGRpcisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5qdWRnZVBhc3Moc3RhbmQsIHRyeUNoZXNzLCBkaXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBqdWRnZVdpbjogZnVuY3Rpb24ganVkZ2VXaW4oKSB7XG4gICAgICAgIHZhciBzZWxmTW92ZUFibGUgPSB0aGlzLmp1ZGdlTW92ZUFibGUoRy5nYW1lTWFuYWdlci50dXJuKTtcbiAgICAgICAgdmFyIG9wcG9Nb3ZlQWJsZSA9IHRoaXMuanVkZ2VNb3ZlQWJsZSgtRy5nYW1lTWFuYWdlci50cnVuKTtcbiAgICAgICAgaWYgKHNlbGZNb3ZlQWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKCFzZWxmTW92ZUFibGUgJiYgb3Bwb01vdmVBYmxlKSB7XG4gICAgICAgICAgICBjYy5sb2coJ2NhbiBub3QgbW92ZSBuZXh0IHR1cm4nKTtcbiAgICAgICAgICAgIEcuZ2FtZU1hbmFnZXIuZm9yY2VDaGFuZ2VUdXJuKCk7XG4gICAgICAgICAgICBHLnJvb21Tb2NrZXQuZW1pdCgnZm9yY2UgY2hhbmdlIHR1cm4nKTtcbiAgICAgICAgfSBlbHNlIGlmICghc2VsZk1vdmVBYmxlICYmICFvcHBvTW92ZUFibGUpIHtcbiAgICAgICAgICAgIGNjLmxvZygnYm90aCBjYW4gbm90IG1vdmUgc29tZW9uZSB3aW4nKTtcbiAgICAgICAgICAgIEcuZ2FtZU1hbmFnZXIuZW5kR2FtZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldENoZXNzQ291bnQ6IGZ1bmN0aW9uIGdldENoZXNzQ291bnQoKSB7XG4gICAgICAgIHZhciBibGFja0NoZXNzID0gMDtcbiAgICAgICAgdmFyIHdoaXRlQ2hlc3MgPSAwO1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuY2hlc3Nlcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCB0aGlzLmNoZXNzZXNbeF0ubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGVzc2VzW3hdW3ldLnR5cGUgPT09IENIRVNTX1RZUEUuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICAgICAgYmxhY2tDaGVzcysrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaGVzc2VzW3hdW3ldLnR5cGUgPT09IENIRVNTX1RZUEUuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpdGVDaGVzcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2JsYWNrQ2hlc3MsIHdoaXRlQ2hlc3NdO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDM4ZWNLZHg3aEFGYk1kUXJDYkx5NHEnLCAnQ2hlc3MnKTtcbi8vIHNjcmlwdHNcXGNlbGxcXENoZXNzLmpzXG5cbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCdDb25zdGFudHMnKTtcbnZhciBDSEVTU19UWVBFID0gQ29uc3RhbnRzLkNIRVNTX1RZUEU7XG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHBpY3M6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogW10sXG4gICAgICAgICAgICB0eXBlOiBbY2MuU3ByaXRlRnJhbWVdXG4gICAgICAgIH0sXG4gICAgICAgIF90eXBlOiBDSEVTU19UWVBFLk5PTkUsXG4gICAgICAgIHR5cGU6IHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl90eXBlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdHlwZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gQ0hFU1NfVFlQRS5CTEFDSykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudChjYy5TcHJpdGUpLnNwcml0ZUZyYW1lID0gdGhpcy5waWNzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IENIRVNTX1RZUEUuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnQoY2MuU3ByaXRlKS5zcHJpdGVGcmFtZSA9IHRoaXMucGljc1sxXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudChjYy5TcHJpdGUpLnNwcml0ZUZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvb3I6IGNjLnAoMCwgMCksIC8v5Z2Q5qCHXG4gICAgICAgIGNoYW5jZTogMCAvL+WRqOWbtOWPr+e/u+i9rOaji+WtkOeahOWPr+iDveaAp1xuICAgIH0sXG5cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICAgICAgdGhpcy50eXBlID0gQ0hFU1NfVFlQRS5OT05FO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcxMmViN2RPVlB0S0diWW0vaVJnWHA4YScsICdDb25zdGFudHMnKTtcbi8vIHNjcmlwdHNcXHV0aWxcXENvbnN0YW50cy5qc1xuXG52YXIgU1RBTkQgPSBjYy5FbnVtKHtcbiAgICBCTEFDSzogNDcsXG4gICAgV0hJVEU6IC00N1xufSk7XG5cbnZhciBDSEVTU19UWVBFID0gY2MuRW51bSh7XG4gICAgTk9ORTogLTEsXG4gICAgQkxBQ0s6IDQ3LFxuICAgIFdISVRFOiAtNDdcbn0pO1xuXG52YXIgR0FNRV9TVEFURSA9IGNjLkVudW0oe1xuICAgIFBSRVBBUkU6IC0xLFxuICAgIFBMQVlJTkc6IC0xLFxuICAgIE9WRVI6IC0xXG59KTtcblxudmFyIERJUiA9IGNjLkVudW0oe1xuICAgIExFRlQ6IC0xLFxuICAgIExFRlRfVVA6IC0xLFxuICAgIFVQOiAtMSxcbiAgICBSSUdIVF9VUDogLTEsXG4gICAgUklHSFQ6IC0xLFxuICAgIFJJR0hUX0RPV046IC0xLFxuICAgIERPV046IC0xLFxuICAgIExFRlRfRE9XTjogLTFcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBTVEFORDogU1RBTkQsXG4gICAgQ0hFU1NfVFlQRTogQ0hFU1NfVFlQRSxcbiAgICBHQU1FX1NUQVRFOiBHQU1FX1NUQVRFLFxuICAgIERJUjogRElSXG59O1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnZTk5M2VFU0l6RkxSNXJRTWRGQ2lZbkgnLCAnR2FtZU1hbmFnZXInKTtcbi8vIHNjcmlwdHNcXHN1cGVyXFxHYW1lTWFuYWdlci5qc1xuXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnQ29uc3RhbnRzJyk7XG52YXIgR0FNRV9TVEFURSA9IENvbnN0YW50cy5HQU1FX1NUQVRFO1xudmFyIFNUQU5EID0gQ29uc3RhbnRzLlNUQU5EO1xudmFyIENIRVNTX1RZUEUgPSBDb25zdGFudHMuQ0hFU1NfVFlQRTtcbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZ2FtZVN0YXRlOiB7XG4gICAgICAgICAgICAnZGVmYXVsdCc6IEdBTUVfU1RBVEUuUFJFUEFSRSxcbiAgICAgICAgICAgIHR5cGU6IEdBTUVfU1RBVEVcbiAgICAgICAgfSxcbiAgICAgICAgdHVybjoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBTVEFORC5CTEFDSyxcbiAgICAgICAgICAgIHR5cGU6IFNUQU5EXG4gICAgICAgIH0sXG4gICAgICAgIGJsYWNrU2NvcmVMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHdoaXRlU2NvcmVMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGluZm9QYW5lbDogY2MuTm9kZSxcbiAgICAgICAgaW5mb0xhYmVsOiBjYy5MYWJlbFxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICAgICAgRy5nYW1lTWFuYWdlciA9IHRoaXM7XG4gICAgICAgIHRoaXMuaW5mb0FuaW1hdGlvbiA9IHRoaXMuaW5mb1BhbmVsLmdldENvbXBvbmVudChjYy5BbmltYXRpb24pO1xuICAgIH0sXG5cbiAgICBzdGFydEdhbWU6IGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy50dXJuID0gU1RBTkQuQkxBQ0s7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlID0gR0FNRV9TVEFURS5QTEFZSU5HO1xuICAgICAgICB0aGlzLnNob3dJbmZvKCdzdGFydCBnYW1lJyk7XG4gICAgfSxcblxuICAgIGVuZEdhbWU6IGZ1bmN0aW9uIGVuZEdhbWUoKSB7XG4gICAgICAgIHZhciBvbkZpbmlzaGVkID0gZnVuY3Rpb24gb25GaW5pc2hlZCgpIHtcbiAgICAgICAgICAgIEcucm9vbVNvY2tldC5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoJ21lbnUnKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pbmZvQW5pbWF0aW9uLm9uKCdmaW5pc2hlZCcsIG9uRmluaXNoZWQsIHRoaXMpO1xuICAgICAgICB0aGlzLmdhbWVTdGF0ZSA9IEdBTUVfU1RBVEUuT1ZFUjtcbiAgICAgICAgdGhpcy5zaG93SW5mbygnZ2FtZSBvdmVyJyk7XG4gICAgfSxcblxuICAgIGNoYW5nZVR1cm46IGZ1bmN0aW9uIGNoYW5nZVR1cm4oKSB7XG4gICAgICAgIGlmICh0aGlzLnR1cm4gPT09IFNUQU5ELkJMQUNLKSB7XG4gICAgICAgICAgICB0aGlzLnR1cm4gPSBTVEFORC5XSElURTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR1cm4gPT09IFNUQU5ELldISVRFKSB7XG4gICAgICAgICAgICB0aGlzLnR1cm4gPSBTVEFORC5CTEFDSztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmb3JjZUNoYW5nZVR1cm46IGZ1bmN0aW9uIGZvcmNlQ2hhbmdlVHVybigpIHtcbiAgICAgICAgLy/ml6DlrZDlj6/kuIvmjaLovrlcbiAgICAgICAgdGhpcy5zaG93SW5mbygnZm9yY2UgY2hhbmdlIHR1cm4nKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VUdXJuKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVNjb3JlOiBmdW5jdGlvbiB1cGRhdGVTY29yZSgpIHtcbiAgICAgICAgdmFyIGNoZXNzQ291bnQgPSBHLmNoZXNzTWFuYWdlci5nZXRDaGVzc0NvdW50KCk7XG4gICAgICAgIHZhciBibGFja0NoZXNzID0gY2hlc3NDb3VudFswXTtcbiAgICAgICAgdmFyIHdoaXRlQ2hlc3MgPSBjaGVzc0NvdW50WzFdO1xuICAgICAgICB0aGlzLmJsYWNrU2NvcmVMYWJlbC5zdHJpbmcgPSBibGFja0NoZXNzICsgJyc7XG4gICAgICAgIHRoaXMud2hpdGVTY29yZUxhYmVsLnN0cmluZyA9IHdoaXRlQ2hlc3MgKyAnJztcbiAgICB9LFxuXG4gICAgc2hvd0luZm86IGZ1bmN0aW9uIHNob3dJbmZvKHR5cGUpIHtcbiAgICAgICAgdmFyIGNoZXNzQ291bnQgPSBHLmNoZXNzTWFuYWdlci5nZXRDaGVzc0NvdW50KCk7XG4gICAgICAgIHZhciBibGFja0NoZXNzID0gY2hlc3NDb3VudFswXTtcbiAgICAgICAgdmFyIHdoaXRlQ2hlc3MgPSBjaGVzc0NvdW50WzFdO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3N0YXJ0IGdhbWUnKSB7XG4gICAgICAgICAgICBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5L2g5piv6JOd6Imy5pa5XFxu5omn6buR5qOL5YWI5omLJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5L2g5piv57qi6Imy5pa5XFxu5omn55m95qOL5ZCO5omLJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZ2FtZSBvdmVyJykge1xuICAgICAgICAgICAgaWYgKGJsYWNrQ2hlc3MgPiB3aGl0ZUNoZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmZvTGFiZWwuc3RyaW5nID0gJ+a4uOaIj+e7k+adn1xcbum7keaji+iDnCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJsYWNrQ2hlc3MgPCB3aGl0ZUNoZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmZvTGFiZWwuc3RyaW5nID0gJ+a4uOaIj+e7k+adn1xcbueZveaji+iDnCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJsYWNrQ2hlc3MgPT09IHdoaXRlQ2hlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5ri45oiP57uT5p2fXFxu5bmz5bGAJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZm9yY2UgY2hhbmdlIHR1cm4nKSB7XG4gICAgICAgICAgICBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn6buR5pa55peg5a2Q5Y+v5LiLXFxu6K+355m95pa55LiL5a2QJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn55m95pa55peg5a2Q5Y+v5LiLXFxu6K+36buR5pa55LiL5a2QJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZm9BbmltYXRpb24ucGxheSgpO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcwNGZkME14d2FwSHJZc2ZDQVQySFJTOCcsICdHbG9iYWwnKTtcbi8vIHNjcmlwdHNcXHV0aWxcXEdsb2JhbC5qc1xuXG53aW5kb3cuRyA9IHtcbiAgICBnbG9iYWxTb2NrZXQ6IG51bGwsIC8v5YWo5bGAXG4gICAgaGFsbFNvY2tldDogbnVsbCwgLy/lpKfljoVcbiAgICBxdWV1ZVNvY2tldDogbnVsbCwgLy/pmJ/liJdcbiAgICByb29tU29ja2V0OiBudWxsLCAvL+aIv+mXtFxuICAgIGdhbWVNYW5hZ2VyOiBudWxsLFxuICAgIGNoZXNzTWFuYWdlcjogbnVsbCxcbiAgICBzdGFuZDogbnVsbFxufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzY3MzdkUEJVRU5ITGF6ZEtMbnQvbFg4JywgJ01hdGNoTWFuYWdlcicpO1xuLy8gc2NyaXB0c1xcc3VwZXJcXE1hdGNoTWFuYWdlci5qc1xuXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnQ29uc3RhbnRzJyk7XG52YXIgU1RBTkQgPSBDb25zdGFudHMuU1RBTkQ7XG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICAgICAgRy5xdWV1ZVNvY2tldCA9IGlvLmNvbm5lY3QoJzEyNy4wLjAuMTo0NzQ3L3F1ZXVlJywgeyAnZm9yY2UgbmV3IGNvbm5lY3Rpb24nOiB0cnVlIH0pO1xuICAgICAgICBHLnF1ZXVlU29ja2V0Lm9uKCdzZXQgc3RhbmQnLCBmdW5jdGlvbiAoc3RhbmQpIHtcbiAgICAgICAgICAgIGlmIChzdGFuZCA9PT0gJ2JsYWNrJykge1xuICAgICAgICAgICAgICAgIEcuc3RhbmQgPSBTVEFORC5CTEFDSztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhbmQgPT09ICd3aGl0ZScpIHtcbiAgICAgICAgICAgICAgICBHLnN0YW5kID0gU1RBTkQuV0hJVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBHLnF1ZXVlU29ja2V0Lm9uKCdtYXRjaCBzdWNjZXNzJywgZnVuY3Rpb24gKHJvb21JZCkge1xuICAgICAgICAgICAgY2MubG9nKCdtYXRjaCBzdWNjZXNzJyArIHJvb21JZCk7XG4gICAgICAgICAgICBHLnJvb21Tb2NrZXQgPSBpby5jb25uZWN0KCcxMjcuMC4wLjE6NDc0Ny9yb29tcycgKyByb29tSWQsIHsgJ2ZvcmNlIG5ldyBjb25uZWN0aW9uJzogdHJ1ZSB9KTtcbiAgICAgICAgICAgIEcucXVldWVTb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKCdnYW1lJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkJ0bkNhbmNlbDogZnVuY3Rpb24gb25CdG5DYW5jZWwoKSB7XG4gICAgICAgIEcucXVldWVTb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoJ21lbnUnKTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2RiZWQ0VFdpTzlHOHJPUExoeG95VVN4JywgJ01lbnVNYW5hZ2VyJyk7XG4vLyBzY3JpcHRzXFxzdXBlclxcTWVudU1hbmFnZXIuanNcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIEcuZ2xvYmFsU29ja2V0ID0gaW8uY29ubmVjdCgnMTI3LjAuMC4xOjQ3NDcnKTtcbiAgICAgICAgLy/mlq3lvIDov57mjqXlkI7lho3ph43mlrDov57mjqXpnIDopoHliqDkuIp7J2ZvcmNlIG5ldyBjb25uZWN0aW9uJzogdHJ1ZX1cbiAgICAgICAgRy5oYWxsU29ja2V0ID0gaW8uY29ubmVjdCgnMTI3LjAuMC4xOjQ3NDcvaGFsbCcsIHsgJ2ZvcmNlIG5ldyBjb25uZWN0aW9uJzogdHJ1ZSB9KTtcbiAgICB9LFxuXG4gICAgb25CdG5TdGFydDogZnVuY3Rpb24gb25CdG5TdGFydCgpIHtcbiAgICAgICAgRy5oYWxsU29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKCdtYXRjaCcpO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiXX0=

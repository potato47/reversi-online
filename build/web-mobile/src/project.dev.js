require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"ChessManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'fd23biEYxBN7IoWrlheRQaR', 'ChessManager');
// scripts\manager\ChessManager.js

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
            cc.log('!!!!!');
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
// scripts\manager\GameManager.js

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
        // G.roomSocket.removeAllListeners();
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
        if (type === 'start game') {
            if (G.stand === STAND.BLACK) {
                this.infoLabel.string = '你是蓝色方\n执黑棋先手';
            } else if (G.stand === STAND.WHITE) {
                this.infoLabel.string = '你是红色方\n执白棋后手';
            }
        } else if (type === 'game over') {
            if (this.blackChess > this.whiteChess) {
                this.infoLabel.string = '游戏结束\n黑棋胜';
            } else if (this.blackChess < this.whiteChess) {
                this.infoLabel.string = '游戏结束\n白棋胜';
            } else if (this.blackChess === this.whiteChess) {
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
    globalSocket: null,
    hallSocket: null,
    queueSocket: null,
    roomSocket: null,
    gameManager: null,
    chessManager: null,
    stand: null
};

cc._RFpop();
},{}],"MatchManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6737dPBUENHLazdKLnt/lX8', 'MatchManager');
// scripts\manager\MatchManager.js

var Constants = require('Constants');
var STAND = Constants.STAND;
cc.Class({
    'extends': cc.Component,

    onLoad: function onLoad() {
        G.queueSocket = io.connect('119.29.40.244:4747/queue', { 'force new connection': true });
        G.queueSocket.on('set stand', function (stand) {
            if (stand === 'black') {
                G.stand = STAND.BLACK;
            } else if (stand === 'white') {
                G.stand = STAND.WHITE;
            }
        });
        G.queueSocket.on('match success', function (roomId) {
            cc.log('match success' + roomId);
            G.roomSocket = io.connect('119.29.40.244:4747/rooms' + roomId, { 'force new connection': true });
            // G.queueSocket.emit('enter room');
            // G.queueSocket.removeAllListeners();
            G.queueSocket.disconnect();
            cc.director.loadScene('game');
        });
    },

    onBtnCancel: function onBtnCancel() {
        // G.queueSocket.emit('cancel match');
        // G.queueSocket.removeAllListeners();
        G.queueSocket.disconnect();
        cc.director.loadScene('menu');
    }
});

cc._RFpop();
},{"Constants":"Constants"}],"MenuManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'dbed4TWiO9G8rOPLhxoyUSx', 'MenuManager');
// scripts\manager\MenuManager.js

cc.Class({
    'extends': cc.Component,

    onLoad: function onLoad() {
        G.globalSocket = io.connect('119.29.40.244:4747');
        G.hallSocket = io.connect('119.29.40.244:4747/hall', { 'force new connection': true });
        // G.globalSocket = io.connect('23.106.147.78:4747');
    },

    onBtnStart: function onBtnStart() {
        // G.hallSocket.emit('enter queue');
        // G.hallSocket.removeAllListeners();
        G.hallSocket.disconnect();
        cc.director.loadScene('match');
    }
});

cc._RFpop();
},{}]},{},["Global","Chess","Constants","MatchManager","MenuManager","GameManager","ChessManager"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6L0NvY29zQ3JlYXRvci9yZXNvdXJjZXMvYXBwLmFzYXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNjcmlwdHMvbWFuYWdlci9DaGVzc01hbmFnZXIuanMiLCJzY3JpcHRzL2NlbGwvQ2hlc3MuanMiLCJzY3JpcHRzL3V0aWwvQ29uc3RhbnRzLmpzIiwic2NyaXB0cy9tYW5hZ2VyL0dhbWVNYW5hZ2VyLmpzIiwic2NyaXB0cy91dGlsL0dsb2JhbC5qcyIsInNjcmlwdHMvbWFuYWdlci9NYXRjaE1hbmFnZXIuanMiLCJzY3JpcHRzL21hbmFnZXIvTWVudU1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnZmQyM2JpRVl4Qk43SW9XcmxoZVJRYVInLCAnQ2hlc3NNYW5hZ2VyJyk7XG4vLyBzY3JpcHRzXFxtYW5hZ2VyXFxDaGVzc01hbmFnZXIuanNcblxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJ0NvbnN0YW50cycpO1xudmFyIENIRVNTX1RZUEUgPSBDb25zdGFudHMuQ0hFU1NfVFlQRTtcbnZhciBTVEFORCA9IENvbnN0YW50cy5TVEFORDtcbnZhciBHQU1FX1NUQVRFID0gQ29uc3RhbnRzLkdBTUVfU1RBVEU7XG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIENPTDogOCxcbiAgICAgICAgUk9XOiA4LFxuICAgICAgICBjaGVzc1ByZWZhYjogY2MuUHJlZmFiLFxuICAgICAgICBjaGVzc2VzOiBbXVxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICAgICAgRy5jaGVzc01hbmFnZXIgPSB0aGlzO1xuICAgICAgICB0aGlzLmNoZXNzV2lkdGggPSB0aGlzLm5vZGUud2lkdGggLyB0aGlzLkNPTDtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLkNPTDsgeCsrKSB7XG4gICAgICAgICAgICB0aGlzLmNoZXNzZXNbeF0gPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgdGhpcy5ST1c7IHkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGVzc05vZGUgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmNoZXNzUHJlZmFiKTtcbiAgICAgICAgICAgICAgICBjaGVzc05vZGUucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICAgICAgICAgIGNoZXNzTm9kZS53aWR0aCA9IHRoaXMuY2hlc3NXaWR0aCAtIDU7XG4gICAgICAgICAgICAgICAgY2hlc3NOb2RlLmhlaWdodCA9IHRoaXMuY2hlc3NXaWR0aCAtIDU7XG4gICAgICAgICAgICAgICAgY2hlc3NOb2RlLnBvc2l0aW9uID0gY2MucCh0aGlzLmNoZXNzV2lkdGggLyAyICsgeCAqIHRoaXMuY2hlc3NXaWR0aCwgdGhpcy5jaGVzc1dpZHRoIC8gMiArIHkgKiB0aGlzLmNoZXNzV2lkdGgpO1xuICAgICAgICAgICAgICAgIHZhciBjaGVzcyA9IGNoZXNzTm9kZS5nZXRDb21wb25lbnQoJ0NoZXNzJyk7XG4gICAgICAgICAgICAgICAgY2hlc3MuY29vciA9IGNjLnAoeCwgeSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGVzc2VzW3hdW3ldID0gY2hlc3M7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRUb3VjaEV2ZW50KGNoZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZXNzZXNbM11bM10udHlwZSA9IENIRVNTX1RZUEUuQkxBQ0s7XG4gICAgICAgIHRoaXMuY2hlc3Nlc1szXVs0XS50eXBlID0gQ0hFU1NfVFlQRS5XSElURTtcbiAgICAgICAgdGhpcy5jaGVzc2VzWzRdWzRdLnR5cGUgPSBDSEVTU19UWVBFLkJMQUNLO1xuICAgICAgICB0aGlzLmNoZXNzZXNbNF1bM10udHlwZSA9IENIRVNTX1RZUEUuV0hJVEU7XG4gICAgICAgIEcuZ2FtZU1hbmFnZXIuc3RhcnRHYW1lKCk7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgRy5yb29tU29ja2V0Lm9uKCd1cGRhdGUgY2hlc3Nib2FyZCcsIGZ1bmN0aW9uIChjaGVzc0Nvb3IpIHtcbiAgICAgICAgICAgIHNlbGYuZmFsbENoZXNzKHNlbGYuY2hlc3Nlc1tjaGVzc0Nvb3IueF1bY2hlc3NDb29yLnldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIEcucm9vbVNvY2tldC5vbignY2hhbmdlIHR1cm4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBHLmdhbWVNYW5hZ2VyLmNoYW5nZVR1cm4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIEcucm9vbVNvY2tldC5vbignZm9yY2UgY2hhbmdlIHR1cm4nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBHLmdhbWVNYW5hZ2VyLmZvcmNlQ2hhbmdlVHVybigpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWRkVG91Y2hFdmVudDogZnVuY3Rpb24gYWRkVG91Y2hFdmVudChjaGVzcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNoZXNzLm5vZGUub24oJ3RvdWNoZW5kJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNjLmxvZygnISEhISEnKTtcbiAgICAgICAgICAgIGlmIChHLmdhbWVNYW5hZ2VyLmdhbWVTdGF0ZSA9PT0gR0FNRV9TVEFURS5QTEFZSU5HICYmIEcuZ2FtZU1hbmFnZXIudHVybiA9PT0gRy5zdGFuZCkge1xuICAgICAgICAgICAgICAgIGlmIChjaGVzcy50eXBlID09PSBDSEVTU19UWVBFLk5PTkUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZGlyID0gMTsgZGlyIDw9IDg7IGRpcisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5qdWRnZVBhc3MoRy5nYW1lTWFuYWdlci50dXJuLCBjaGVzcywgZGlyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmFsbENoZXNzKGNoZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHLnJvb21Tb2NrZXQuZW1pdCgndXBkYXRlIGNoZXNzYm9hcmQnLCBjaGVzcy5jb29yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXIgPT09IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBmYWxsQ2hlc3M6IGZ1bmN0aW9uIGZhbGxDaGVzcyhjaGVzcykge1xuICAgICAgICBpZiAoRy5nYW1lTWFuYWdlci50dXJuID09PSBTVEFORC5CTEFDSykge1xuICAgICAgICAgICAgY2hlc3MudHlwZSA9IENIRVNTX1RZUEUuQkxBQ0s7XG4gICAgICAgIH0gZWxzZSBpZiAoRy5nYW1lTWFuYWdlci50dXJuID09PSBTVEFORC5XSElURSkge1xuICAgICAgICAgICAgY2hlc3MudHlwZSA9IENIRVNTX1RZUEUuV0hJVEU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgZGlyID0gMTsgZGlyIDw9IDg7IGRpcisrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5qdWRnZVBhc3MoRy5nYW1lTWFuYWdlci50dXJuLCBjaGVzcywgZGlyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlUGFzcyhjaGVzcywgZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBHLmdhbWVNYW5hZ2VyLnVwZGF0ZVNjb3JlKCk7XG4gICAgICAgIEcuZ2FtZU1hbmFnZXIuY2hhbmdlVHVybigpO1xuICAgICAgICB0aGlzLmp1ZGdlV2luKCk7XG4gICAgfSxcblxuICAgIG5lYXJDaGVzczogZnVuY3Rpb24gbmVhckNoZXNzKGNoZXNzLCBkaXIpIHtcbiAgICAgICAgc3dpdGNoIChkaXIpIHtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAvL2xlZnRcbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci54ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54IC0gMV1bY2hlc3MuY29vci55XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgLy9sZWZ0IHVwXG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLmNvb3IueCAhPT0gMCAmJiBjaGVzcy5jb29yLnkgIT09IHRoaXMuUk9XIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVzc2VzW2NoZXNzLmNvb3IueCAtIDFdW2NoZXNzLmNvb3IueSArIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAvL3VwXG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLmNvb3IueSAhPT0gdGhpcy5ST1cgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54XVtjaGVzcy5jb29yLnkgKyAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgLy9yaWdodCB1cFxuICAgICAgICAgICAgICAgIGlmIChjaGVzcy5jb29yLnggIT09IHRoaXMuQ09MIC0gMSAmJiBjaGVzcy5jb29yLnkgIT09IHRoaXMuUk9XIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVzc2VzW2NoZXNzLmNvb3IueCArIDFdW2NoZXNzLmNvb3IueSArIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAvL3JpZ2h0XG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLmNvb3IueCAhPT0gdGhpcy5DT0wgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54ICsgMV1bY2hlc3MuY29vci55XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgLy9yaWdodCBkb3duXG4gICAgICAgICAgICAgICAgaWYgKGNoZXNzLmNvb3IueCAhPT0gdGhpcy5DT0wgLSAxICYmIGNoZXNzLmNvb3IueSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVzc2VzW2NoZXNzLmNvb3IueCArIDFdW2NoZXNzLmNvb3IueSAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgICAvL2Rvd25cbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci55ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZXNzZXNbY2hlc3MuY29vci54XVtjaGVzcy5jb29yLnkgLSAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgICAgLy9sZWZ0IGRvd25cbiAgICAgICAgICAgICAgICBpZiAoY2hlc3MuY29vci54ICE9PSAwICYmIGNoZXNzLmNvb3IueSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVzc2VzW2NoZXNzLmNvb3IueCAtIDFdW2NoZXNzLmNvb3IueSAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAganVkZ2VQYXNzOiBmdW5jdGlvbiBqdWRnZVBhc3Moc3RhbmQsIGNoZXNzLCBkaXIpIHtcbiAgICAgICAgdmFyIHRlbXBDaGVzcyA9IGNoZXNzO1xuICAgICAgICB0ZW1wQ2hlc3MgPSB0aGlzLm5lYXJDaGVzcyhjaGVzcywgZGlyKTtcbiAgICAgICAgaWYgKHRlbXBDaGVzcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0ZW1wQ2hlc3MudHlwZSA9PT0gLXN0YW5kKSB7XG4gICAgICAgICAgICB0ZW1wQ2hlc3MgPSB0aGlzLm5lYXJDaGVzcyh0ZW1wQ2hlc3MsIGRpcik7XG4gICAgICAgICAgICBpZiAodGVtcENoZXNzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRlbXBDaGVzcy50eXBlID09IHN0YW5kKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBjaGFuZ2VQYXNzOiBmdW5jdGlvbiBjaGFuZ2VQYXNzKGNoZXNzLCBkaXIpIHtcbiAgICAgICAgdmFyIHRlbXBDaGVzcyA9IHRoaXMubmVhckNoZXNzKGNoZXNzLCBkaXIpO1xuICAgICAgICB3aGlsZSAodGVtcENoZXNzLnR5cGUgPT09IC1HLmdhbWVNYW5hZ2VyLnR1cm4pIHtcbiAgICAgICAgICAgIHRlbXBDaGVzcy50eXBlID0gY2hlc3MudHlwZTtcbiAgICAgICAgICAgIHRlbXBDaGVzcyA9IHRoaXMubmVhckNoZXNzKHRlbXBDaGVzcywgZGlyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBqdWRnZU1vdmVBYmxlOiBmdW5jdGlvbiBqdWRnZU1vdmVBYmxlKHN0YW5kKSB7XG4gICAgICAgIC8v5Yik5patc3RhbmTmmK/lkKbmnInlj6/okL3lrZDnmoTlnLDmlrlcbiAgICAgICAgdmFyIHRyeUNoZXNzID0gbnVsbDtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLkNPTDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMuUk9XOyB5KyspIHtcbiAgICAgICAgICAgICAgICB0cnlDaGVzcyA9IHRoaXMuY2hlc3Nlc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZiAodHJ5Q2hlc3MudHlwZSA9PT0gQ0hFU1NfVFlQRS5OT05FKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGRpciA9IDE7IGRpciA8PSA4OyBkaXIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuanVkZ2VQYXNzKHN0YW5kLCB0cnlDaGVzcywgZGlyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAganVkZ2VXaW46IGZ1bmN0aW9uIGp1ZGdlV2luKCkge1xuICAgICAgICB2YXIgc2VsZk1vdmVBYmxlID0gdGhpcy5qdWRnZU1vdmVBYmxlKEcuZ2FtZU1hbmFnZXIudHVybik7XG4gICAgICAgIHZhciBvcHBvTW92ZUFibGUgPSB0aGlzLmp1ZGdlTW92ZUFibGUoLUcuZ2FtZU1hbmFnZXIudHJ1bik7XG4gICAgICAgIGlmIChzZWxmTW92ZUFibGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmICghc2VsZk1vdmVBYmxlICYmIG9wcG9Nb3ZlQWJsZSkge1xuICAgICAgICAgICAgY2MubG9nKCdjYW4gbm90IG1vdmUgbmV4dCB0dXJuJyk7XG4gICAgICAgICAgICBHLmdhbWVNYW5hZ2VyLmZvcmNlQ2hhbmdlVHVybigpO1xuICAgICAgICAgICAgRy5yb29tU29ja2V0LmVtaXQoJ2ZvcmNlIGNoYW5nZSB0dXJuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXNlbGZNb3ZlQWJsZSAmJiAhb3Bwb01vdmVBYmxlKSB7XG4gICAgICAgICAgICBjYy5sb2coJ2JvdGggY2FuIG5vdCBtb3ZlIHNvbWVvbmUgd2luJyk7XG4gICAgICAgICAgICBHLmdhbWVNYW5hZ2VyLmVuZEdhbWUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRDaGVzc0NvdW50OiBmdW5jdGlvbiBnZXRDaGVzc0NvdW50KCkge1xuICAgICAgICB2YXIgYmxhY2tDaGVzcyA9IDA7XG4gICAgICAgIHZhciB3aGl0ZUNoZXNzID0gMDtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLmNoZXNzZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgdGhpcy5jaGVzc2VzW3hdLmxlbmd0aDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hlc3Nlc1t4XVt5XS50eXBlID09PSBDSEVTU19UWVBFLkJMQUNLKSB7XG4gICAgICAgICAgICAgICAgICAgIGJsYWNrQ2hlc3MrKztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2hlc3Nlc1t4XVt5XS50eXBlID09PSBDSEVTU19UWVBFLldISVRFKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaXRlQ2hlc3MrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtibGFja0NoZXNzLCB3aGl0ZUNoZXNzXTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzAzOGVjS2R4N2hBRmJNZFFyQ2JMeTRxJywgJ0NoZXNzJyk7XG4vLyBzY3JpcHRzXFxjZWxsXFxDaGVzcy5qc1xuXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnQ29uc3RhbnRzJyk7XG52YXIgQ0hFU1NfVFlQRSA9IENvbnN0YW50cy5DSEVTU19UWVBFO1xuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBwaWNzOiB7XG4gICAgICAgICAgICAnZGVmYXVsdCc6IFtdLFxuICAgICAgICAgICAgdHlwZTogW2NjLlNwcml0ZUZyYW1lXVxuICAgICAgICB9LFxuICAgICAgICBfdHlwZTogQ0hFU1NfVFlQRS5OT05FLFxuICAgICAgICB0eXBlOiB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3R5cGUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IENIRVNTX1RZUEUuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnQoY2MuU3ByaXRlKS5zcHJpdGVGcmFtZSA9IHRoaXMucGljc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBDSEVTU19UWVBFLldISVRFKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSkuc3ByaXRlRnJhbWUgPSB0aGlzLnBpY3NbMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnQoY2MuU3ByaXRlKS5zcHJpdGVGcmFtZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb29yOiBjYy5wKDAsIDApLCAvL+WdkOagh1xuICAgICAgICBjaGFuY2U6IDAgLy/lkajlm7Tlj6/nv7vovazmo4vlrZDnmoTlj6/og73mgKdcbiAgICB9LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IENIRVNTX1RZUEUuTk9ORTtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMTJlYjdkT1ZQdEtHYlltL2lSZ1hwOGEnLCAnQ29uc3RhbnRzJyk7XG4vLyBzY3JpcHRzXFx1dGlsXFxDb25zdGFudHMuanNcblxudmFyIFNUQU5EID0gY2MuRW51bSh7XG4gICAgQkxBQ0s6IDQ3LFxuICAgIFdISVRFOiAtNDdcbn0pO1xuXG52YXIgQ0hFU1NfVFlQRSA9IGNjLkVudW0oe1xuICAgIE5PTkU6IC0xLFxuICAgIEJMQUNLOiA0NyxcbiAgICBXSElURTogLTQ3XG59KTtcblxudmFyIEdBTUVfU1RBVEUgPSBjYy5FbnVtKHtcbiAgICBQUkVQQVJFOiAtMSxcbiAgICBQTEFZSU5HOiAtMSxcbiAgICBPVkVSOiAtMVxufSk7XG5cbnZhciBESVIgPSBjYy5FbnVtKHtcbiAgICBMRUZUOiAtMSxcbiAgICBMRUZUX1VQOiAtMSxcbiAgICBVUDogLTEsXG4gICAgUklHSFRfVVA6IC0xLFxuICAgIFJJR0hUOiAtMSxcbiAgICBSSUdIVF9ET1dOOiAtMSxcbiAgICBET1dOOiAtMSxcbiAgICBMRUZUX0RPV046IC0xXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgU1RBTkQ6IFNUQU5ELFxuICAgIENIRVNTX1RZUEU6IENIRVNTX1RZUEUsXG4gICAgR0FNRV9TVEFURTogR0FNRV9TVEFURSxcbiAgICBESVI6IERJUlxufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2U5OTNlRVNJekZMUjVyUU1kRkNpWW5IJywgJ0dhbWVNYW5hZ2VyJyk7XG4vLyBzY3JpcHRzXFxtYW5hZ2VyXFxHYW1lTWFuYWdlci5qc1xuXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnQ29uc3RhbnRzJyk7XG52YXIgR0FNRV9TVEFURSA9IENvbnN0YW50cy5HQU1FX1NUQVRFO1xudmFyIFNUQU5EID0gQ29uc3RhbnRzLlNUQU5EO1xudmFyIENIRVNTX1RZUEUgPSBDb25zdGFudHMuQ0hFU1NfVFlQRTtcbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZ2FtZVN0YXRlOiB7XG4gICAgICAgICAgICAnZGVmYXVsdCc6IEdBTUVfU1RBVEUuUFJFUEFSRSxcbiAgICAgICAgICAgIHR5cGU6IEdBTUVfU1RBVEVcbiAgICAgICAgfSxcbiAgICAgICAgdHVybjoge1xuICAgICAgICAgICAgJ2RlZmF1bHQnOiBTVEFORC5CTEFDSyxcbiAgICAgICAgICAgIHR5cGU6IFNUQU5EXG4gICAgICAgIH0sXG4gICAgICAgIGJsYWNrU2NvcmVMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHdoaXRlU2NvcmVMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGluZm9QYW5lbDogY2MuTm9kZSxcbiAgICAgICAgaW5mb0xhYmVsOiBjYy5MYWJlbFxuICAgIH0sXG5cbiAgICAvLyB1c2UgdGhpcyBmb3IgaW5pdGlhbGl6YXRpb25cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICAgICAgRy5nYW1lTWFuYWdlciA9IHRoaXM7XG4gICAgICAgIC8vIEcucm9vbVNvY2tldC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5pbmZvQW5pbWF0aW9uID0gdGhpcy5pbmZvUGFuZWwuZ2V0Q29tcG9uZW50KGNjLkFuaW1hdGlvbik7XG4gICAgfSxcblxuICAgIHN0YXJ0R2FtZTogZnVuY3Rpb24gc3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLnR1cm4gPSBTVEFORC5CTEFDSztcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUgPSBHQU1FX1NUQVRFLlBMQVlJTkc7XG4gICAgICAgIHRoaXMuc2hvd0luZm8oJ3N0YXJ0IGdhbWUnKTtcbiAgICB9LFxuXG4gICAgZW5kR2FtZTogZnVuY3Rpb24gZW5kR2FtZSgpIHtcbiAgICAgICAgdmFyIG9uRmluaXNoZWQgPSBmdW5jdGlvbiBvbkZpbmlzaGVkKCkge1xuICAgICAgICAgICAgRy5yb29tU29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnbWVudScpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmluZm9BbmltYXRpb24ub24oJ2ZpbmlzaGVkJywgb25GaW5pc2hlZCwgdGhpcyk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlID0gR0FNRV9TVEFURS5PVkVSO1xuICAgICAgICB0aGlzLnNob3dJbmZvKCdnYW1lIG92ZXInKTtcbiAgICB9LFxuXG4gICAgY2hhbmdlVHVybjogZnVuY3Rpb24gY2hhbmdlVHVybigpIHtcbiAgICAgICAgaWYgKHRoaXMudHVybiA9PT0gU1RBTkQuQkxBQ0spIHtcbiAgICAgICAgICAgIHRoaXMudHVybiA9IFNUQU5ELldISVRFO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHVybiA9PT0gU1RBTkQuV0hJVEUpIHtcbiAgICAgICAgICAgIHRoaXMudHVybiA9IFNUQU5ELkJMQUNLO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZvcmNlQ2hhbmdlVHVybjogZnVuY3Rpb24gZm9yY2VDaGFuZ2VUdXJuKCkge1xuICAgICAgICAvL+aXoOWtkOWPr+S4i+aNoui+uVxuICAgICAgICB0aGlzLnNob3dJbmZvKCdmb3JjZSBjaGFuZ2UgdHVybicpO1xuICAgICAgICB0aGlzLmNoYW5nZVR1cm4oKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU2NvcmU6IGZ1bmN0aW9uIHVwZGF0ZVNjb3JlKCkge1xuICAgICAgICB2YXIgY2hlc3NDb3VudCA9IEcuY2hlc3NNYW5hZ2VyLmdldENoZXNzQ291bnQoKTtcbiAgICAgICAgdmFyIGJsYWNrQ2hlc3MgPSBjaGVzc0NvdW50WzBdO1xuICAgICAgICB2YXIgd2hpdGVDaGVzcyA9IGNoZXNzQ291bnRbMV07XG4gICAgICAgIHRoaXMuYmxhY2tTY29yZUxhYmVsLnN0cmluZyA9IGJsYWNrQ2hlc3MgKyAnJztcbiAgICAgICAgdGhpcy53aGl0ZVNjb3JlTGFiZWwuc3RyaW5nID0gd2hpdGVDaGVzcyArICcnO1xuICAgIH0sXG5cbiAgICBzaG93SW5mbzogZnVuY3Rpb24gc2hvd0luZm8odHlwZSkge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3N0YXJ0IGdhbWUnKSB7XG4gICAgICAgICAgICBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5L2g5piv6JOd6Imy5pa5XFxu5omn6buR5qOL5YWI5omLJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5L2g5piv57qi6Imy5pa5XFxu5omn55m95qOL5ZCO5omLJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZ2FtZSBvdmVyJykge1xuICAgICAgICAgICAgaWYgKHRoaXMuYmxhY2tDaGVzcyA+IHRoaXMud2hpdGVDaGVzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5mb0xhYmVsLnN0cmluZyA9ICfmuLjmiI/nu5PmnZ9cXG7pu5Hmo4vog5wnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJsYWNrQ2hlc3MgPCB0aGlzLndoaXRlQ2hlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5ri45oiP57uT5p2fXFxu55m95qOL6IOcJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5ibGFja0NoZXNzID09PSB0aGlzLndoaXRlQ2hlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn5ri45oiP57uT5p2fXFxu5bmz5bGAJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZm9yY2UgY2hhbmdlIHR1cm4nKSB7XG4gICAgICAgICAgICBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuQkxBQ0spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn6buR5pa55peg5a2Q5Y+v5LiLXFxu6K+355m95pa55LiL5a2QJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoRy5zdGFuZCA9PT0gU1RBTkQuV0hJVEUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZm9MYWJlbC5zdHJpbmcgPSAn55m95pa55peg5a2Q5Y+v5LiLXFxu6K+36buR5pa55LiL5a2QJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZm9BbmltYXRpb24ucGxheSgpO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcwNGZkME14d2FwSHJZc2ZDQVQySFJTOCcsICdHbG9iYWwnKTtcbi8vIHNjcmlwdHNcXHV0aWxcXEdsb2JhbC5qc1xuXG53aW5kb3cuRyA9IHtcbiAgICBnbG9iYWxTb2NrZXQ6IG51bGwsXG4gICAgaGFsbFNvY2tldDogbnVsbCxcbiAgICBxdWV1ZVNvY2tldDogbnVsbCxcbiAgICByb29tU29ja2V0OiBudWxsLFxuICAgIGdhbWVNYW5hZ2VyOiBudWxsLFxuICAgIGNoZXNzTWFuYWdlcjogbnVsbCxcbiAgICBzdGFuZDogbnVsbFxufTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzY3MzdkUEJVRU5ITGF6ZEtMbnQvbFg4JywgJ01hdGNoTWFuYWdlcicpO1xuLy8gc2NyaXB0c1xcbWFuYWdlclxcTWF0Y2hNYW5hZ2VyLmpzXG5cbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCdDb25zdGFudHMnKTtcbnZhciBTVEFORCA9IENvbnN0YW50cy5TVEFORDtcbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICBHLnF1ZXVlU29ja2V0ID0gaW8uY29ubmVjdCgnMTE5LjI5LjQwLjI0NDo0NzQ3L3F1ZXVlJywgeyAnZm9yY2UgbmV3IGNvbm5lY3Rpb24nOiB0cnVlIH0pO1xuICAgICAgICBHLnF1ZXVlU29ja2V0Lm9uKCdzZXQgc3RhbmQnLCBmdW5jdGlvbiAoc3RhbmQpIHtcbiAgICAgICAgICAgIGlmIChzdGFuZCA9PT0gJ2JsYWNrJykge1xuICAgICAgICAgICAgICAgIEcuc3RhbmQgPSBTVEFORC5CTEFDSztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhbmQgPT09ICd3aGl0ZScpIHtcbiAgICAgICAgICAgICAgICBHLnN0YW5kID0gU1RBTkQuV0hJVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBHLnF1ZXVlU29ja2V0Lm9uKCdtYXRjaCBzdWNjZXNzJywgZnVuY3Rpb24gKHJvb21JZCkge1xuICAgICAgICAgICAgY2MubG9nKCdtYXRjaCBzdWNjZXNzJyArIHJvb21JZCk7XG4gICAgICAgICAgICBHLnJvb21Tb2NrZXQgPSBpby5jb25uZWN0KCcxMTkuMjkuNDAuMjQ0OjQ3NDcvcm9vbXMnICsgcm9vbUlkLCB7ICdmb3JjZSBuZXcgY29ubmVjdGlvbic6IHRydWUgfSk7XG4gICAgICAgICAgICAvLyBHLnF1ZXVlU29ja2V0LmVtaXQoJ2VudGVyIHJvb20nKTtcbiAgICAgICAgICAgIC8vIEcucXVldWVTb2NrZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICBHLnF1ZXVlU29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnZ2FtZScpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25CdG5DYW5jZWw6IGZ1bmN0aW9uIG9uQnRuQ2FuY2VsKCkge1xuICAgICAgICAvLyBHLnF1ZXVlU29ja2V0LmVtaXQoJ2NhbmNlbCBtYXRjaCcpO1xuICAgICAgICAvLyBHLnF1ZXVlU29ja2V0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICBHLnF1ZXVlU29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKCdtZW51Jyk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdkYmVkNFRXaU85RzhyT1BMaHhveVVTeCcsICdNZW51TWFuYWdlcicpO1xuLy8gc2NyaXB0c1xcbWFuYWdlclxcTWVudU1hbmFnZXIuanNcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIEcuZ2xvYmFsU29ja2V0ID0gaW8uY29ubmVjdCgnMTE5LjI5LjQwLjI0NDo0NzQ3Jyk7XG4gICAgICAgIEcuaGFsbFNvY2tldCA9IGlvLmNvbm5lY3QoJzExOS4yOS40MC4yNDQ6NDc0Ny9oYWxsJywgeyAnZm9yY2UgbmV3IGNvbm5lY3Rpb24nOiB0cnVlIH0pO1xuICAgICAgICAvLyBHLmdsb2JhbFNvY2tldCA9IGlvLmNvbm5lY3QoJzIzLjEwNi4xNDcuNzg6NDc0NycpO1xuICAgIH0sXG5cbiAgICBvbkJ0blN0YXJ0OiBmdW5jdGlvbiBvbkJ0blN0YXJ0KCkge1xuICAgICAgICAvLyBHLmhhbGxTb2NrZXQuZW1pdCgnZW50ZXIgcXVldWUnKTtcbiAgICAgICAgLy8gRy5oYWxsU29ja2V0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICBHLmhhbGxTb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoJ21hdGNoJyk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyJdfQ==

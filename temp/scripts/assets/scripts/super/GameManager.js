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
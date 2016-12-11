const Constants = require('Constants');
const GAME_STATE = Constants.GAME_STATE;
const STAND = Constants.STAND;
const CHESS_TYPE = Constants.CHESS_TYPE;
cc.Class({
    extends: cc.Component,

    properties: {
        gameState: {
            default: GAME_STATE.PREPARE,
            type: GAME_STATE
        },
        turn: {
            default: STAND.BLACK,
            type: STAND
        },
        blackScoreLabel: cc.Label,
        whiteScoreLabel: cc.Label,
        infoPanel: cc.Node,
        infoLabel: cc.Label
    },

    // use this for initialization
    onLoad: function () {
        G.gameManager = this;
        this.infoAnimation = this.infoPanel.getComponent(cc.Animation);
    },

    startGame() {
        this.turn = STAND.BLACK;
        this.gameState = GAME_STATE.PLAYING;
        this.showInfo('start game');
    },

    endGame() {
        let onFinished = () =>{
            G.roomSocket.disconnect();
            cc.director.loadScene('menu');
        }
        this.infoAnimation.on('finished',onFinished,this);
        this.gameState = GAME_STATE.OVER;
        this.showInfo('game over');
    },

    changeTurn() {
        if (this.turn === STAND.BLACK) {
            this.turn = STAND.WHITE;
        } else if (this.turn === STAND.WHITE) {
            this.turn = STAND.BLACK;
        }
    },

    forceChangeTurn() {//无子可下换边
        this.showInfo('force change turn');
        this.changeTurn();
    },

    updateScore() {
        let chessCount = G.chessManager.getChessCount();
        let blackChess = chessCount[0];
        let whiteChess = chessCount[1];
        this.blackScoreLabel.string = blackChess + '';
        this.whiteScoreLabel.string = whiteChess + '';
    },

    showInfo(type) {
        let chessCount = G.chessManager.getChessCount();
        let blackChess = chessCount[0];
        let whiteChess = chessCount[1];
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

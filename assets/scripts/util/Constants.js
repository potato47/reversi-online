const STAND = cc.Enum({
    BLACK: 47,
    WHITE: -47
});

const CHESS_TYPE = cc.Enum({
    NONE: -1,
    BLACK: 47,
    WHITE: -47
});

const GAME_STATE = cc.Enum({
    PREPARE: -1,
    PLAYING: -1,
    OVER: -1
});

const DIR = cc.Enum({
    LEFT:-1,
    LEFT_UP:-1,
    UP:-1,
    RIGHT_UP:-1,
    RIGHT:-1,
    RIGHT_DOWN:-1,
    DOWN:-1,
    LEFT_DOWN:-1
});

module.exports = {
    STAND:STAND,
    CHESS_TYPE:CHESS_TYPE,
    GAME_STATE:GAME_STATE,
    DIR:DIR
};
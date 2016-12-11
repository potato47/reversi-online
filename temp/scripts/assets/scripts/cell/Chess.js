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
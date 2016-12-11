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
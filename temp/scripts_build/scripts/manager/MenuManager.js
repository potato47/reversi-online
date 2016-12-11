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
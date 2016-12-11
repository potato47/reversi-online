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
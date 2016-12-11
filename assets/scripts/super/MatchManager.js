const Constants = require('Constants');
const STAND = Constants.STAND;
cc.Class({
    extends: cc.Component,

    onLoad: function () {
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

    onBtnCancel() {
        G.queueSocket.disconnect();
        cc.director.loadScene('menu');
    }
});

cc.Class({
    extends: cc.Component,

    onLoad: function () {
        G.globalSocket = io.connect('127.0.0.1:4747');
        //断开连接后再重新连接需要加上{'force new connection': true}
        G.hallSocket = io.connect('127.0.0.1:4747/hall',{'force new connection': true});
    },

    onBtnStart() {
        G.hallSocket.disconnect();
        cc.director.loadScene('match');
    }
});

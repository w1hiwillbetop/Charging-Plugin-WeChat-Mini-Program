// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-1g3t535839d44ddc',
        traceUser: true,
      });
    }

    // 开启调试
    wx.setEnableDebug({
      enableDebug: true
    });
    
    // 监听错误
    wx.onError((err) => {
      console.error('全局错误：', err);
    });
  },
  
  onPageNotFound(res) {
    console.error('页面不存在：', res);
    wx.redirectTo({
      url: 'pages/index/index'
    });
  }
})

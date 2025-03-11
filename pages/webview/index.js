Page({
  data: {
    url: '',
    errorMsg: '',
    showError: false
  },
  onLoad: function(options) {
    if (options.url) {
      try {
        let decodedUrl = decodeURIComponent(options.url);
        
        // 验证URL格式
        if (!decodedUrl.startsWith('https://')) {
          // 如果不是https开头，尝试将http转为https
          if (decodedUrl.startsWith('http://')) {
            decodedUrl = 'https://' + decodedUrl.substring(7);
            console.log('已将http转为https:', decodedUrl);
          } else {
            throw new Error('URL必须以http或https开头');
          }
        }
        
        // 设置URL
        this.setData({
          url: decodedUrl
        });
        
        console.log('webview将加载URL:', decodedUrl);
      } catch (error) {
        console.error('URL处理错误:', error, options.url);
        this.setData({
          showError: true,
          errorMsg: '无法打开链接：' + options.url + '\n\n可能的原因：\n1. 链接格式不正确\n2. 链接域名未在小程序管理后台配置\n3. 仅支持https安全链接'
        });
      }
    } else {
      this.setData({
        showError: true,
        errorMsg: '未提供有效的链接地址'
      });
    }
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});
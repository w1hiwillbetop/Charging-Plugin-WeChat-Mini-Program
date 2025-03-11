// pages/index/index.js
Page({
  data: {
    showModal: false,
    modalTitle: '',
    loading: false
  },

  onLoad() {
    console.log('页面加载');
  },

  onShow() {
    console.log('页面显示');
  },

  // 点击充电桩按钮
  onButtonClick(event) {
    const group = event.currentTarget.dataset.group;
    console.log('点击了第', group, '组充电桩');
    
    wx.navigateTo({
      url: `../charger/index?group=${group}`,
      success: () => {
        console.log('页面跳转成功');
      },
      fail: (error) => {
        console.error('页面跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});
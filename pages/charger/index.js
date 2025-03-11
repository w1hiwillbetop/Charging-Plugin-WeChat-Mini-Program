// pages/charger/index.js
Page({
  data: {
    imagePath: '',
    groupNumber: 0,
    fileID: ''
  },

  onLoad: function(options) {
    const group = options.group;
    if (group) {
      const groupNumber = parseInt(group);
      const fileID = `cloud://cloud1-1g3t535839d44ddc.636c-cloud1-1g3t535839d44ddc-1347962214/${groupNumber}.jpg`;
      
      this.setData({
        imagePath: fileID,
        groupNumber: groupNumber,
        fileID: fileID
      });

      // 预加载图片
      wx.cloud.downloadFile({
        fileID: fileID,
        success: res => {
          this.setData({
            localPath: res.tempFilePath
          });
        },
        fail: err => {
          console.error('图片预加载失败:', err);
        }
      });
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 点击图片
  previewImage: function() {
    if (this.data.localPath) {
      wx.previewImage({
        current: this.data.localPath,
        urls: [this.data.localPath],
        showmenu: true,
        success: () => {
          // 显示操作菜单
          setTimeout(() => {
            this.showActionMenu();
          }, 100);
        }
      });
    } else {
      wx.showToast({
        title: '图片加载中...',
        icon: 'loading'
      });
    }
  },

  // 长按图片
  handleLongPress: function() {
    this.showActionMenu();
  },

  // 显示操作菜单
  showActionMenu: function() {
    wx.showActionSheet({
      itemList: ['识别二维码', '保存图片', '分享'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.scanQRCode();
            break;
          case 1:
            this.saveImage();
            break;
          case 2:
            wx.showShareMenu({
              withShareTicket: true,
              menus: ['shareAppMessage', 'shareTimeline']
            });
            break;
        }
      }
    });
  },

  // 扫描二维码
  scanQRCode: function() {
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });

    console.log('开始调用云函数，fileID:', this.data.fileID);

    wx.cloud.callFunction({
      name: 'scanQRCode',
      data: {
        fileID: this.data.fileID
      },
      success: res => {
        console.log('云函数返回结果:', res);
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          const qrResult = res.result.data;
          console.log('二维码内容：', qrResult);
          
          // 解析二维码内容
          let targetPath = '';
          let targetAppId = ''; // 默认小程序ID
          
          try {
            // 尝试从二维码内容中提取appId
            if (qrResult.includes('appid=') || qrResult.includes('appId=')) {
              const appIdMatch = qrResult.match(/[?&](appid|appId)=([^&]+)/);
              if (appIdMatch && appIdMatch[2]) {
                targetAppId = appIdMatch[2];
                console.log('从二维码提取到appId:', targetAppId);
              }
            }
            
            // 尝试解析二维码内容获取路径
            if (qrResult.includes('path=')) {
              // 如果包含path参数
              const queryString = qrResult.split('?')[1];
              const pathMatch = queryString.match(/[?&]path=([^&]+)/);
              targetPath = pathMatch ? decodeURIComponent(pathMatch[1]) : '';
            } else if (qrResult.startsWith('/')) {
              // 如果直接是路径格式
              targetPath = qrResult;
            } else if (qrResult.includes('/pages/')) {
              // 如果包含页面路径
              targetPath = qrResult.substring(qrResult.indexOf('/pages/'));
            } else if (qrResult.includes('ev.acrel-eem.com/evqrcode')) {
              // 处理特定格式的URL: https://ev.acrel-eem.com/evqrcode?id=xxx
              // 尝试提取id参数并直接传递给目标小程序的设备页面
              const idMatch = qrResult.match(/[?&]id=([^&]+)/);
              const id = idMatch ? idMatch[1] : '';
              if (id) {
                targetPath = `/pages/device/index?id=${id}`;
                console.log('提取ID并使用设备页面路径:', targetPath);
              } else {
                // 如果没有提取到id，则使用备选方案
                targetPath = `/pages/index/index`;
                console.log('未提取到ID，使用首页路径:', targetPath);
              }
            } else if (qrResult.startsWith('http')) {
              // 处理其他HTTP URL
              // 尝试从URL中提取可能的id参数
              const idMatch = qrResult.match(/[?&]id=([^&]+)/);
              const id = idMatch ? idMatch[1] : '';
              if (id) {
                targetPath = `/pages/device/index?id=${id}`;
                console.log('从URL提取ID并使用设备页面路径:', targetPath);
              } else {
                // 如果没有id参数，尝试使用充电桩详情页面
                targetPath = `/pages/index/index`;
                console.log('未从URL提取到ID，使用首页路径:', targetPath);
              }
            }
            
            console.log('解析到的路径:', targetPath);
            console.log('目标小程序ID:', targetAppId);
            
            // 检查是否有appId
            if (targetAppId) {
              // 如果有appId，跳转到目标小程序的具体页面
              wx.navigateToMiniProgram({
                appId: targetAppId,
                path: targetPath,
                success: function() {
                  console.log('跳转成功，路径:', targetPath);
                  wx.showToast({
                    title: '跳转成功',
                    icon: 'success'
                  });
                },
                fail: function(err) {
                  console.error('跳转失败:', err);
                  let errorMsg = '跳转失败';
                  
                  if (err.errMsg.includes('permission denied')) {
                    errorMsg = '暂无权限跳转到目标小程序，请确保已在开发者后台配置跳转关系';
                  } else if (err.errMsg.includes('invalid appid')) {
                    errorMsg = '目标小程序配置有误，请联系开发者';
                  } else {
                    errorMsg = '跳转失败，' + err.errMsg;
                  }
                  
                  wx.showModal({
                    title: '提示',
                    content: errorMsg + '\n二维码内容：' + qrResult + '\n解析路径：' + targetPath + '\n目标小程序ID：' + targetAppId,
                    showCancel: false
                  });
                }
              });
            } else if (qrResult.startsWith('http')) {
              // 如果是URL但没有appId，使用webview页面打开
              console.log('使用webview打开URL:', qrResult);
              wx.navigateTo({
                url: `/pages/webview/index?url=${encodeURIComponent(qrResult)}`,
                success: function() {
                  console.log('跳转到webview成功');
                  wx.showToast({
                    title: '跳转成功',
                    icon: 'success'
                  });
                },
                fail: function(err) {
                  console.error('跳转到webview失败:', err);
                  wx.showModal({
                    title: '提示',
                    content: '无法打开链接，' + err.errMsg + '\n二维码内容：' + qrResult,
                    showCancel: false
                  });
                }
              });
            } else {
              // 既不是小程序码也不是URL
              wx.showModal({
                title: '无法跳转',
                content: '未能识别二维码类型，内容：' + qrResult,
                showCancel: false
              });
            }
          } catch (error) {
            console.error('解析二维码内容失败:', error);
            wx.showModal({
              title: '解析失败',
              content: '二维码内容格式不正确：' + qrResult,
              showCancel: false
            });
          }
        } else {
          console.error('识别失败:', res.result ? res.result.error : '未知错误');
          wx.showModal({
            title: '识别失败',
            content: '未能识别图片中的二维码，请确保图片清晰完整',
            showCancel: false
          });
        }
      },
      fail: err => {
        console.error('云函数调用失败：', err);
        wx.hideLoading();
        wx.showModal({
          title: '识别失败',
          content: '系统错误，请稍后重试',
          showCancel: false
        });
      }
    });
  },

  // 保存图片到相册
  saveImage: function() {
    if (!this.data.localPath) {
      wx.showLoading({
        title: '正在下载...',
        mask: true
      });

      wx.cloud.downloadFile({
        fileID: this.data.fileID,
        success: res => {
          this.setData({
            localPath: res.tempFilePath
          });
          this.saveImageToAlbum(res.tempFilePath);
        },
        fail: err => {
          console.error('下载失败:', err);
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } else {
      this.saveImageToAlbum(this.data.localPath);
    }
  },

  // 保存图片到相册的具体实现
  saveImageToAlbum: function(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败:', err);
        if (err.errMsg.indexOf('auth deny') >= 0) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存到相册',
            showCancel: false,
            success: () => {
              wx.openSetting();
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack();
  }
});
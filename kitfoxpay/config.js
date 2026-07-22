/**
 * KitfoxPay 配置
 * 连接 OpenHubs PAY 支付系统
 *
 * 支持通过环境变量覆盖配置（Docker 部署模式）
 * 本地开发模式：直接修改本文件
 * Docker 模式：通过 docker-compose environment 传入
 */

module.exports = {
  // ========== Jeepay 支付平台配置（OpenHubs PAY）==========
  jeepay: {
    baseUrl: process.env.JEEPAY_BASE_URL || 'http://localhost:9216',
    mchNo: process.env.JEEPAY_MCH_NO || 'M1784708760',
    appId: process.env.JEEPAY_APP_ID || '6a607e98e4b022b84e41f0e2',
    privateKey: process.env.JEEPAY_PRIVATE_KEY || '7VDAb2oPaMq2Wqt6YuWHt3d1kpMhBRgNI673IxZUtysRU6xqr6AGncAVelIzZHak1UiwaDDuHRz0h3tNbON25HbVJ3gBGtwlsAJIGZdtQoRULz78dFXZgawdzJtwJCU4'
  },

  // ========== 易支付接口配置（适配器）==========
  epay: {
    pid: process.env.EPAY_PID || '1001',
    key: process.env.EPAY_KEY || 'testEpKey1234567890abcdef'
  },

  // ========== 服务器配置 ==========
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '9219', 10),
    siteDomain: process.env.SITE_DOMAIN || 'http://localhost:9219'
  },

  // ========== 管理后台配置 ==========
  admin: {
    password: process.env.ADMIN_PASSWORD || 'admin123'
  }
};

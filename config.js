module.exports = {
  botToken: process.env.BOT_TOKEN || '',
  sellerKey: process.env.SELLER_KEY || '',
  customerRoleId: process.env.CUSTOMER_ROLE_ID || '',
  supportRoleId: process.env.SUPPORT_ROLE_ID || '',
  tweakerKeyLevel: parseInt(process.env.TWEAKER_KEY_LEVEL) || 1,
  wasdKeyLevel: parseInt(process.env.WASD_KEY_LEVEL) || 2
};

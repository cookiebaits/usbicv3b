// config/config.js
module.exports = {
  // -----------------------------------------------------------------
  // Admin portal authentication
  // -----------------------------------------------------------------
  ADMIN_USER: process.env.ADMIN_USER || 'icuadmin_placeholder',
  ADMIN_PASS: process.env.ADMIN_PASS || 'Temporaryp4ss_placeholder',

  // USB device identification
  USB_VID: 0x1234,
  USB_PID: 0xabcd,

  // Other misc settings …
};

module.exports = {
  apps: [
    {
      name: 'amigos-printer-bridge',
      script: './printer_bridge.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/printer_error.log',
      out_file: './logs/printer_out.log',
      merge_logs: true,
    },
  ],
};

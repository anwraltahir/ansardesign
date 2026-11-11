module.exports = {
  apps: [
    {
      name: 'ansar-smart-design',
      script: 'node',
      args: '--loader tsx server.ts',
      cwd: '/var/www/ansar-smart-design',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

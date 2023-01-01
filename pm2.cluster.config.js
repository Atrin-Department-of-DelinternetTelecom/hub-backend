module.exports = {
  apps: [
    {
      name: 'delinternet-hub',
      script: './src/server.ts',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      node_args: ['--max-old-space-size=8192', '-r', 'ts-node/register'],
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'production',
        SERVER_IP: '0.0.0.0',
        TZ: 'Europe/Madrid',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};

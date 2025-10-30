module.exports = {
  apps: [
    {
      name: "shield-hierarquia-bot",
      script: "src/index.js",
      node_args: "--enable-source-maps",
      env: { NODE_ENV: "production" },
    },
  ],
};

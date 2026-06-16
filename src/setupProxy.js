const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/maps",
    createProxyMiddleware({
      target: "https://maps.googleapis.com",
      changeOrigin: true,
      pathRewrite: { "^/api/maps": "" },
    })
  );
};
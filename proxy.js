// A simple Notion reverse proxy for PaaS platforms like Render.
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTION_HOST = 'www.notion.so';

app.use('/', createProxyMiddleware({
    target: `https://${NOTION_HOST}`,
    changeOrigin: true,
    ws: true, // Enable WebSocket support for real-time collaboration
    onProxyRes: function (proxyRes, req, res) {
        // Rewrite cookie domain
        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
            proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                cookie.replace(/domain=\.?notion\.so/g, `domain=${req.hostname}`)
            );
        }
        // Remove security headers
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-frame-options'];
    },
    // IMPORTANT: Rewrite the host header in the request body (HTML/JS)
    selfHandleResponse: true,
    onProxyReq: function(proxyReq, req, res) {
        // Add a referer header
        proxyReq.setHeader('Referer', `https://${NOTION_HOST}/`);
    }
}));

// The http-proxy-middleware doesn't rewrite the body, so we do it here.
// This is a simplified approach. For a full solution, a more complex body parsing would be needed.
// However, the header modifications often are sufficient.

app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});

import { app } from './server/app.ts';
import express from 'express';
import path from 'path';
import fs from 'fs';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Serve dist directory if built
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 منصة المصمم الذكي – أمانة الدعوة (أنصار السنة)`);
  console.log(`📡 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Official Domain: https://design.ansaralsuna.net`);
  console.log(`====================================================`);
});

export default server;

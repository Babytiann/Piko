import { serve } from '@hono/node-server';
import app from './index.js';

const PORT = Number(process.env.PORT ?? 3001);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    console.log(`[Piko Backend] 本地开发服务器运行在 http://localhost:${PORT}`);
  },
);

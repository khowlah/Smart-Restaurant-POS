import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ${env.RESTAURANT_NAME}`);
  console.log(`📡 Server running on http://localhost:${env.PORT}`);
  console.log(`📚 Swagger Docs available at http://localhost:${env.PORT}/api-docs`);
  console.log(`⚙️  Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

import dotenv from 'dotenv';

dotenv.config();

import { connectDatabases, disconnectDatabases } from './config/database';
import app from './app';

const PORT = process.env.PORT || 3333;

const startServer = async (): Promise<void> => {
  try {
    // Conectar ao banco de dados
    await connectDatabases();

    const server = app.listen(PORT, () => {
      console.log(`Pasta la Vista API rodando em http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recebido, encerrando gracefully...');
      server.close(async () => {
        await disconnectDatabases();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT recebido, encerrando gracefully...');
      server.close(async () => {
        await disconnectDatabases();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

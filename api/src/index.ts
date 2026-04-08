import dotenv from 'dotenv';

dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3333;

const startServer = async (): Promise<void> => {
  try {
    app.listen(PORT, () => {
      console.log(`🍝 Pasta la Vista API rodando em http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

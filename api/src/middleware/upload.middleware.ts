import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuração do Multer para upload de imagens em memória (buffer).
 * Limita tamanho a 5MB e aceita apenas imagens.
 */
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Aceito: JPEG, PNG, WebP, GIF'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * Middleware para tratar erros do Multer
 */
export const handleUploadError = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'error',
        message: 'Arquivo muito grande. Máximo: 5MB',
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      message: `Erro no upload: ${err.message}`,
    });
    return;
  }

  if (err.message.includes('Tipo de arquivo')) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  next(err);
};

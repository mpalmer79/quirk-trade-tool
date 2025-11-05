import express, { Request, Response } from 'express';

export function createServer() {
  const app = express();

  app.get('/health/live', (_req: Request, res: Response): void => {
    res.status(200).send('OK');
  });

  app.get('/health/ready', (_req: Request, res: Response): void => {
    res.status(200).json({ ok: true });
  });

  app.get('/start', (_req: Request, res: Response): void => {
    res.status(200).json({ started: true });
  });

  app.get('/stop', (_req: Request, res: Response): void => {
    res.status(200).json({ stopped: true });
  });

  return app;
}

import { Router, Request, Response } from 'express';
import { Controller } from './controller';

export function createAuthRouter(controller: Controller): Router {
  const router = Router();

  router.post('/google/login', async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'idToken is required in the request body.' });
    }
    
    const result = await controller.handleGoogleLogin(idToken);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { Controller } from './controller';
import { ApiResponse } from '../types';

export function createAuthRouter(controller: Controller): Router {
  const router = Router();

  router.post('/google/login', async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'idToken is required in the request body.' } as ApiResponse<any>);
    }
    
    const result = await controller.handleGoogleLogin(idToken);

    if (!result.success) {
      return res.status(400).json(result as ApiResponse<any>);
    }

    return res.status(200).json(result as ApiResponse<any>);
  });

  // GET /users/me 라우트 추가
  router.get('/users/me', async (req: Request, res: Response) => {
    // 1. 여기에 JWT를 검증하는 미들웨어 또는 코드가 들어갈 부분입니다.
    //    (예: req.headers.authorization에서 토큰 추출 및 검증)
    console.log("[AuthRouter] GET /users/me request received.");
    console.log("[AuthRouter] JWT verification would happen here.");

    // 2. 검증된 JWT에서 사용자 ID를 추출하고, 해당 ID로 사용자 이름을 조회하는 코드가 들어갈 부분입니다.
    //    (예: const userId = req.user.id; const userName = await controller.getUserName(userId);)
    console.log("[AuthRouter] User name lookup would happen here.");

    // 일단 성공 응답을 반환합니다.
    return res.status(200).json({ 
      success: true, 
      message: "User info retrieved successfully (mocked).", 
      data: { name: "Mock User" } } as ApiResponse<{ name: string }>);
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { Controller } from '../controller/controller';
import { ApiResponse } from '../types';
import { verifyToken } from '../middleware/authMiddleware'; // verifyToken 임포트

export function createAuthRouter(controller: Controller): Router {
  const router = Router();

  router.post('/google/login', async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'idToken is required in the request body.' } as ApiResponse<any>);
    }
    
    const [appToken, error] = await controller.handleGoogleLogin(idToken);
    if(error){
      return res.status(400).json({ success: false, message: `${error.message}`});
    }
    return res.status(200).json({ success: true, message: "login success", data: appToken});
  });

  // GET /users/me 라우트에 verifyToken 미들웨어 적용
  router.get('/users/me', verifyToken, async (req: Request, res: Response) => {
    // verifyToken 미들웨어가 실행된 후에는 req.user에 디코딩된 토큰 정보가 있습니다.
    if (!req.user || !req.user.userId) {
      // 이 경우는 verifyToken 미들웨어에서 이미 처리되었어야 하지만, 타입 안전성을 위해 한 번 더 확인
      return res.status(401).json({ success: false, message: 'User not authenticated or user ID missing.' } as ApiResponse<any>);
    }

    const userId = req.user.userId;
    console.log(`[AuthRouter] GET /users/me request received for userId: ${userId}`);

    const [user, error] = await controller.getUserProfile(userId);
    if (error) {
      return res.status(500).json({ success: false, message: error.message } as ApiResponse<any>);
    }

    // if (!user) {
    //   return res.status(404).json({ success: false, message: 'User not found.' } as ApiResponse<any>);
    // }

    return res.status(200).json({ 
      success: true, 
      message: "User info retrieved successfully.", 
      data: user });
  });

  return router;
}

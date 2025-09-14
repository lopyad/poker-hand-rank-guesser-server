import { Router, Request, Response } from 'express';
import { Controller } from '../../controller/controller';
import { ApiResponse } from '../../types'; // Import ApiResponse
import { verifyToken } from '../../middleware/authMiddleware';

export function createGameRouter(controller: Controller): Router {
  const router = Router();

  router.get('/multi/room', verifyToken, (req: Request, res: Response) => {
    // verifyToken 미들웨어가 실행된 후에는 req.user에 디코딩된 토큰 정보가 있습니다.
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated or user ID missing.' } as ApiResponse<any>);
    }

    const userId = req.user.userId as string;
    const [roomCode, error] = controller.createGameRoom(userId);

    res.status(200).json({
        success: true,
        message: "success to create room code",
        data: roomCode
    });
  });

  router.put('/multi/room', verifyToken, (req: Request, res: Response) => {
    // verifyToken 미들웨어가 실행된 후에는 req.user에 디코딩된 토큰 정보가 있습니다.
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated or user ID missing.' } as ApiResponse<any>);
    }

    const userId = req.user.userId;
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ success: false, message: 'roomCode is required.' });
    }

    const [_, error] = controller.checkRoomJoinAndWhitelistPlayer(roomCode, userId);
    if(error){
      return res.status(400).json({ sucess: false, message: error.message});
    }

    res.status(200).json({ sucess: true, message: "Player successfully whitelisted for room."});
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { Controller } from '../../controller/controller';
import { ApiResponse } from '../../types'; // Import ApiResponse
import { verifyToken } from '../../middleware/authMiddleware';

export function createGameRouter(controller: Controller): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Game router is working!' });
  });

  router.get('/multi', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Multiplayer game endpoint!' });
  });

  router.get('/multi/room', verifyToken, (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      // 이 경우는 verifyToken 미들웨어에서 이미 처리되었어야 하지만, 타입 안전성을 위해 한 번 더 확인
      return res.status(401).json({ success: false, message: 'User not authenticated or user ID missing.' } as ApiResponse<any>);
    }
    const playerId = req.user.userId as string; // Assuming playerId is passed as a query parameter
    if (!playerId) {
      return res.status(400).json({ 
        sucess: false,
        message: 'Player ID is required.' });
    }
    const roomCode = controller.createGameRoom(playerId);

    const response: ApiResponse<string> = {
        success: true,
        message: "success to create room code",
        data: roomCode
    }
    res.status(200).json(response);
  });

  router.put('/multi/room', verifyToken, (req: Request, res: Response) => {
    const playerId = req.user?.userId;
    const { roomCode } = req.body;

    if (!roomCode || !playerId) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Room code and player ID are required.',
        data: null,
      };
      return res.status(400).json(response);
    }

    const isPossible = controller.checkRoomJoinPossibility(roomCode, playerId);

    const response: ApiResponse<null> = {
      success: isPossible,
      message: isPossible ? 'Player successfully whitelisted for room.' : 'Failed to whitelist player: Room not found or full.',
      data: null,
    };
    res.status(isPossible ? 200 : 400).json(response);
  });

  return router;
}

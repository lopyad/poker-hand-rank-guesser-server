import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Controller } from '../../controller/controller'; // Import Controller
import { IncomingMessage } from 'http'; // Import IncomingMessage
import { verifyJwt } from '../../middleware/authMiddleware'; // Import verifyJwt
import jwt from 'jsonwebtoken'; // Import jwt for error types

// Extend WebSocket to store roomCode, playerId, and userId
interface CustomWebSocket extends WebSocket {
  roomCode?: string;
  playerId?: string;
  userId?: string; // Add userId
}

export function createWebSocketServer(httpServer: Server, controller: Controller) {
  const wss = new WebSocketServer({ server: httpServer });

  console.log('WebSocket server is running');

  // 전체 클라이언트에게 메시지를 브로드캐스트하는 함수
  const broadcast = (message: string) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (ws: CustomWebSocket, req: IncomingMessage) => {
    console.log('A new client connected');

    // 1. URL 쿼리 매개변수에서 토큰 추출
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ success: false, message: 'Authentication token missing in URL query parameter.' }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    try {
      if(token){
      // 2. verifyJwt 함수를 사용하여 토큰 검증
      const decoded = verifyJwt(token);
      ws.userId = decoded.userId; // Attach authenticated userId to WebSocket object
      console.log(`Client ${ws.userId} authenticated.`);

      ws.send(JSON.stringify({ success: true, message: `Welcome, ${ws.userId}!` }));
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
      let errorMessage = 'Authentication failed.';
      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Authentication failed: Token expired.';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Authentication failed: Invalid token.';
      }
      ws.send(JSON.stringify({ success: false, message: errorMessage }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    // 클라이언트로부터 메시지를 받았을 때의 처리
    ws.on('message', (message: string) => {
      console.log('Received message =>', message.toString());
      try {
        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.type === 'joinRoom') {
          const { roomCode } = parsedMessage;
          const playerId = ws.userId;
          if (!roomCode || !playerId) {
            ws.send(JSON.stringify({ success: false, message: 'roomCode and playerId are required for joinRoom.' }));
            return;
          }

          // Check if player is whitelisted before allowing join
          const room = controller.getGameRoom(roomCode);
          if (!room || !room.whitelistedPlayers.has(playerId)) {
            ws.send(JSON.stringify({ success: false, message: 'Room not found or player not whitelisted.' }));
            return;
          }

          const joined = controller.joinGameRoom(roomCode, playerId, ws);
          if (joined) {
            ws.roomCode = roomCode; // Store roomCode on WebSocket object
            ws.playerId = playerId; // Store playerId on WebSocket object
            ws.send(JSON.stringify({ success: true, message: `Joined room ${roomCode}.` }));
            // Broadcast to room that player has joined (GameManager already does this)
          } else {
            ws.send(JSON.stringify({ success: false, message: `Failed to join room ${roomCode}.` }));
          }
        } else {
          // Handle other message types or broadcast
          broadcast(`Someone said: ${message.toString()}`);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message or handle it:', error);
        ws.send(JSON.stringify({ success: false, message: 'Invalid message format.' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      // If the disconnected client was in a room, remove them
      if (ws.roomCode && ws.playerId) {
        controller.leaveGameRoom(ws.roomCode, ws.playerId);
      }
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });

    // 연결된 클라이언트에게 환영 메시지 전송
    ws.send('Welcome to the WebSocket server!');
  });

  return wss;
}

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Controller } from '../controller/controller'; // Import Controller

// Extend WebSocket to store roomCode and playerId
interface CustomWebSocket extends WebSocket {
  roomCode?: string;
  playerId?: string;
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

  wss.on('connection', (ws: CustomWebSocket) => {
    console.log('A new client connected');

    // 클라이언트로부터 메시지를 받았을 때의 처리
    ws.on('message', (message: string) => {
      console.log('Received message =>', message.toString());
      try {
        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.type === 'joinRoom') {
          const { roomCode, playerId } = parsedMessage;
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

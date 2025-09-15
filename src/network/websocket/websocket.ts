import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Controller } from '../../controller/controller'; // Import Controller
import { IncomingMessage } from 'http'; // Import IncomingMessage
import { verifyJwt } from '../../middleware/authMiddleware'; // Import verifyJwt
import jwt from 'jsonwebtoken'; // Import jwt for error types
import { C2S_Message, S2C_Message, CustomWebSocket } from '../../types';



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

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ success: false, message: 'Authentication token missing in URL query parameter.' }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    
    try {
      //if(token){
        const [decoded, error] = verifyJwt(token);
        if(error){
          throw error;
        }
        ws.userId = decoded.userId;
        console.log(`Client ${ws.userId} authenticated.`);

        ws.send(JSON.stringify({ success: true, message: `Welcome, ${ws.userId}!` }));
      //}
    } catch (error) {
      console.error('JWT verification failed:', error);
      let errorMessage = 'Authentication failed.';
      
      ws.send(JSON.stringify({ success: false, message: errorMessage }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    ws.on('message', async (message: string) => {
      console.log('Received message =>', message.toString());
      try {
        const parsedMessage: C2S_Message = JSON.parse(message.toString());
        if (!parsedMessage.type || !parsedMessage.payload) {
          ws.send(JSON.stringify({ success: false, message: 'type or payload is missing' }))
        }

        const [_, error] = await controller.handleWebsocketMessage(parsedMessage, ws);
        if(error){
          const responseMessage: S2C_Message = {
            type: 'RESPONSE',
            payload: { success: false, message: error.message}
          }
          ws.send(JSON.stringify(responseMessage));
        }

        // ws.send(JSON.stringify(result));
        
      } catch (error) {
        console.error('Failed to parse WebSocket message or handle it:', error);
        const responseMessage: S2C_Message = {
          type: 'RESPONSE',
          payload: { success: false, message: "Invalid message format."}
        }
        ws.send(JSON.stringify(responseMessage));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      // If the disconnected client was in a room, remove them
      if (ws.roomCode) {
        controller.leaveGameRoom(ws.roomCode, ws.userId);
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

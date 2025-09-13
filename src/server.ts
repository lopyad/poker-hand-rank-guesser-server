import express from 'express';
import cors from 'cors';
import { Controller } from "./controller/controller";
import { createAuthRouter } from './network/router/auth.router';
import { createGameRouter } from './network/router/game.router';
import { createWebSocketServer } from './network/websocket/websocket'; // New import

export function startServer(controller: Controller) {
  const app = express();
  const port = process.env.PORT || 3000;

  // 환경에 따른 CORS 설정
  const corsOptions = {
    origin: process.env.NODE_ENV === 'development' 
      ? '*' 
      : process.env.CORS_ORIGIN,
  };
  app.use(cors(corsOptions));

  app.use(express.json());

  app.use('/auth', createAuthRouter(controller));
  app.use('/game', createGameRouter(controller));

  const httpServer = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  // 생성된 HTTP 서버를 웹소켓 서버에 전달합니다.
  createWebSocketServer(httpServer, controller);
}

import express from 'express';
import cors from 'cors';
import { Controller } from "./controller/controller";
import { createAuthRouter } from './controller/auth.router';

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

  // 인증 관련 라우트를 미들웨어로 등록합니다.
  const authRouter = createAuthRouter(controller);
  app.use('/auth', authRouter);

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

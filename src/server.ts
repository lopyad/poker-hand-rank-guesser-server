import express from 'express';
import { Controller } from "./controller/controller";
import { createAuthRouter } from './controller/auth.router';

export function startServer(controller: Controller) {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // 인증 관련 라우트를 미들웨어로 등록합니다.
  const authRouter = createAuthRouter(controller);
  app.use('/auth', authRouter);

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

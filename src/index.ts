import 'dotenv/config';
import { startServer } from './server';
import { Controller } from "./controller/controller";
import { AuthService } from "./service/auth.service";
import { Repository } from "./repository/repository";
import { Service } from "./service/service"; // Service 추가 임포트
import { GameService } from "./service/game.service"; // Updated import

// 1. 애플리케이션의 핵심 의존성을 여기서 생성합니다.
const repository = new Repository();
const authService = new AuthService(repository); // AuthService 인스턴스
const generalService = new Service(repository); // Service 인스턴스
const gameService = new GameService(repository); // GameService instance
const controller = new Controller(authService, generalService, gameService); // Controller에 세 서비스 주입

// 2. 생성된 의존성을 서버에 주입하여 실행합니다.
startServer(controller);

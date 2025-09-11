import 'dotenv/config';
import { startServer } from './server';
import { Controller } from "./controller/controller";
import { Service } from "./service/service";
import { Repository } from "./repository/repository";

// 1. 애플리케이션의 핵심 의존성을 여기서 생성합니다.
const repository = new Repository();
const service = new Service(repository);
const controller = new Controller(service);

// 2. 생성된 의존성을 서버에 주입하여 실행합니다.
startServer(controller);

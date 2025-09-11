import { Controller } from "./controller/controller";
import { Service } from "./service/service";
import { Repository } from "./repository/repository";

async function main() {
  // 1. 의존성 주입과 함께 각 계층의 인스턴스를 생성합니다.
  const repository = new Repository();
  const service = new Service(repository);
  const controller = new Controller(service);

  console.log("--- 1. Running Google Login Simulation (Success Case) ---");
  const validToken = "dummy-google-id-token-from-client";
  const successResult = await controller.handleGoogleLogin(validToken);
  console.log(JSON.stringify(successResult, null, 2));

  console.log("\n--- 2. Running Google Login Simulation (Failure Case) ---");
  const invalidToken = "invalid-token"; // 서비스 계층에서 실패를 유발하는 토큰
  const failureResult = await controller.handleGoogleLogin(invalidToken);
  console.log(JSON.stringify(failureResult, null, 2));
}

main();

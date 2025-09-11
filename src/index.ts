import { Controller } from "./controller/controller";
import { Service } from "./service/service";
import { Repository } from "./repository/repository";

// 1. Create instances of the classes
const repository = new Repository();
const service = new Service(repository);
const controller = new Controller(service);

// 2. Call whoAmI on each instance
repository.whoAmI();
service.whoAmI();
controller.whoAmI();

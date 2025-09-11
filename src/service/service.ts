import { Repository, User } from "../repository/repository";
import { Failable } from "../types";

export class Service {
  constructor(private readonly repository: Repository) {}

  whoAmI() {
    console.log("Here is Service");
  }
}

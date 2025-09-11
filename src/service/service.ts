import { Repository } from "../repository/repository";
import { Failable, User } from "../types"; // Import User type

export class Service {
  constructor(private readonly repository: Repository) {}

  whoAmI() {
    console.log("Here is Service");
  }

  async getUserById(id: string): Promise<Failable<User>> {
    console.log(`[Service] Getting user by ID: ${id}`);
    return this.repository.getUserById(id);
  }
}

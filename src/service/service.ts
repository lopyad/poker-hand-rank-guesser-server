import { Repository } from "../repository/repository";

export class Service {
  constructor(private readonly repository: Repository) {}

  getHandRank(hand: string[]): string {
    return this.repository.getHandRank(hand);
  }

  whoAmI() {
    console.log("Here is Service");
  }
}
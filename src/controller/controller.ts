import { Service } from "../service/service";

export class Controller {
  constructor(private readonly service: Service) {}

  getHandRank(hand: string[]): { rank: string } {
    const rank = this.service.getHandRank(hand);
    return { rank };
  }

  whoAmI() {
    console.log("Here is Controller");
  }
}
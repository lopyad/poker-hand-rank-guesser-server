export class Repository {
  // In a real application, this would interact with a database.
  getHandRank(hand: string[]): string {
    // Dummy implementation
    return "High Card";
  }

  whoAmI() {
    console.log("Here is Repository");
  }
}
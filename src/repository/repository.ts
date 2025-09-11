// src/repository/repository.ts
import { Failable, User } from "../types"; // Import User from types.ts
import { MongoUserRepository } from "./mongo.repository"; // Import the new MongoUserRepository

// Define the interface for user repository operations
export interface IUserRepository {
  findUserByGoogleId(googleId: string): Promise<Failable<User>>;
  createUser(userData: Omit<User, 'id' | '_id'>): Promise<Failable<User>>;
  getUserById(id: string): Promise<Failable<User>>; 
  // Add other methods as needed, e.g., updateUser, deleteUser
}

export class Repository implements IUserRepository {
  private mongoUserRepository: MongoUserRepository;

  constructor() {
    this.mongoUserRepository = new MongoUserRepository();
  }

  whoAmI() {
    console.log("Here is Repository (using MongoUserRepository)");
  }

  async findUserByGoogleId(googleId: string): Promise<Failable<User>> {
    return this.mongoUserRepository.findUserByGoogleId(googleId);
  }

  async createUser(userData: Omit<User, 'id' | '_id'>): Promise<Failable<User>> {
    return this.mongoUserRepository.createUser(userData);
  }

  async getUserById(id: string): Promise<Failable<User>> {
    return this.mongoUserRepository.getUserById(id);
  }

  // You might want to expose closeDb or handle it in a lifecycle hook
  async closeDb() {
    await this.mongoUserRepository.closeDb();
  }
}
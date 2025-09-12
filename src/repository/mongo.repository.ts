// src/repository/mongo.repository.ts
import { MongoClient, Collection, ObjectId } from 'mongodb';
import { Failable, User } from "../types"; // Import User from types.ts

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'poker_guesser_db';

export class MongoUserRepository {
  private client: MongoClient;
  private usersCollection: Collection<User> | null;

  constructor() {
    this.client = new MongoClient(mongoUri);
    this.usersCollection = null;
    this.connectToDb();
  }

  private async connectToDb() {
    try {
      await this.client.connect();
      console.log("[MongoUserRepository] Connected to MongoDB");
      const db = this.client.db(dbName);
      this.usersCollection = db.collection<User>('users');
    } catch (error) {
      console.error("[MongoUserRepository] Failed to connect to MongoDB", error);
      process.exit(1); // Exit application if connection fails
    }
  }

  async findUserByGoogleId(googleId: string): Promise<Failable<User>> {
    try {
      console.log(`[MongoUserRepository] Finding user with googleId: ${googleId}`);
      const user = await this.usersCollection?.findOne({ googleId });
      if (user) {
        return [user, null];
      } else {
        return [null, new Error("fail to find user")]; // 유저를 찾지 못함
      }
    } catch (e: any) {
      console.error("[MongoUserRepository] Error finding user by Google ID:", e);
      return [null, new Error(`Database error while finding user: ${e.message}`)];
    }
  }

  async createUser(userData: Omit<User, 'id' | '_id'>): Promise<Failable<User>> {
    try {
      console.log(`[MongoUserRepository] Creating user: ${userData.name}`);
      if(this.usersCollection){
        const result = await this.usersCollection.insertOne({
          ...userData,
          id: new ObjectId().toHexString(), // Use ObjectId as internal ID
        } as User);

        if (result.acknowledged && result.insertedId) {
          const newUser = { _id: result.insertedId, ...userData, id: result.insertedId.toHexString() };
          return [newUser, null];
        } else {
          return [null, new Error("Failed to create user: Insert operation not acknowledged.")];
        }
      } else {
        return [null, new Error("")];
      }

    } catch (e: any) {
      console.error("[MongoUserRepository] Error creating user:", e);
      return [null, new Error(`Database error while creating user: ${e.message}`)];
    }
  }

  async getUserById(id: string): Promise<Failable<User>> {
    try {
      console.log(`[MongoUserRepository] Getting user by id: ${id}`);
      const user = await this.usersCollection?.findOne({ id });
      if (user) {
        return [user, null];
      } else {
        return [null, new Error("fail to find user")];
      }
    } catch (e: any) {
      console.error("[MongoUserRepository] Error getting user by ID:", e);
      return [null, new Error(`Database error while getting user: ${e.message}`)];
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<Failable<User>> {
    try {
      console.log(`[MongoUserRepository] Updating user ${id} with:`, updates);
      if(this.usersCollection === null)
        return [null, new Error("")];
      const result = await this.usersCollection.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (result!==null && result.name) {
        return [result, null];
      } else {
        return [null, new Error("User not found or no updates applied.")];
      }
    } catch (e: any) {
      console.error("[MongoUserRepository] Error updating user:", e);
      return [null, new Error(`Database error while updating user: ${e.message}`)];
    }
  }

  async deleteUser(id: string): Promise<Failable<boolean>> {
    try {
      console.log(`[MongoUserRepository] Deleting user with id: ${id}`);
      if(this.usersCollection === null)
        return [null, new Error("")];
      const result = await this.usersCollection.deleteOne({ id });
      if (result.deletedCount === 1) {
        return [true, null];
      } else {
        return [null, new Error("User not found or not deleted.")];
      }
    } catch (e: any) {
      console.error("[MongoUserRepository] Error deleting user:", e);
      return [null, new Error(`Database error while deleting user: ${e.message}`)];
    }
  }

  async closeDb() {
    try {
      await this.client.close();
      console.log("[MongoUserRepository] Disconnected from MongoDB");
    } catch (error) {
      console.error("[MongoUserRepository] Error closing MongoDB connection:", error);
    }
  }
}
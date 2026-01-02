//import { createClient, RedisClientType } from "redis";
//import { RedisConfig } from "./types";
//
//class RedisClientSingleton {
//  private static instance: RedisClientSingleton;
//  private client: RedisClientType | null = null;
//  private isConnecting = false;
//
//  private constructor() {}
//
//  public static getInstance(): RedisClientSingleton {
//    if (!RedisClientSingleton.instance) {
//      RedisClientSingleton.instance = new RedisClientSingleton();
//    }
//    return RedisClientSingleton.instance;
//  }
//
//  public async getClient(): Promise<RedisClientType> {
//    if (this.client && this.client.isOpen) {
//      return this.client;
//    }
//
//    if (this.isConnecting) {
//      // Wait for existing connection attempt
//      while (this.isConnecting) {
//        await new Promise((resolve) => setTimeout(resolve, 100));
//      }
//      if (this.client && this.client.isOpen) {
//        return this.client;
//      }
//    }
//
//    return this.connect();
//  }
//
//  private async connect(): Promise<RedisClientType> {
//    this.isConnecting = true;
//
//    try {
//      const config: RedisConfig = {
//        url: process.env.REDIS_URL || "redis://localhost:6379",
//        password: process.env.REDIS_PASSWORD,
//        database: parseInt(process.env.REDIS_DATABASE || "0"),
//        // host: process.env.REDIS_CLOUD_HOST || "localhost",
//        // port: Number(process.env.REDIS_CLOUD_PORT) || 16067,
//      };
//
//      this.client = createClient({
//        // LOCAL CONFIGURATION
//        url: config.url,
//        // password: config.password,
//        // database: config.database,
//        socket: {
//          reconnectStrategy: (retries) => {
//            if (retries > 5) {
//              console.error("Redis connection failed after 5 retries");
//              return false;
//            }
//            return Math.min(retries * 50, 500);
//          },
//
//          // CLOUD CONFIGURATION
//          // host: "redis-16067.crce176.me-central-1-1.ec2.redns.redis-cloud.com",
//          // port: 16067,
//        },
//      });
//
//      // Event listeners
//      this.client.on("error", (err) => {
//        console.error("Redis Client Error:", err);
//      });
//
//      this.client.on("connect", () => {
//        console.log("Redis client connected");
//      });
//
//      this.client.on("ready", () => {
//        console.log("Redis client ready");
//      });
//
//      this.client.on("end", () => {
//        console.log("Redis client disconnected");
//      });
//
//      await this.client.connect();
//
//      return this.client;
//    } catch (error) {
//      console.error("Failed to connect to Redis:", error);
//      throw error;
//    } finally {
//      this.isConnecting = false;
//    }
//  }
//
//  public async disconnect(): Promise<void> {
//    if (this.client) {
//      await this.client.destroy();
//      this.client = null;
//    }
//  }
//
//  public isConnected(): boolean {
//    return this.client?.isOpen || false;
//  }
//}
//
//export const redisClient = RedisClientSingleton.getInstance();

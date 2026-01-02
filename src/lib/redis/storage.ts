//import { RedisClientType } from "redis";
//import { redisClient } from "./client";
//import {
//  KeyOptions,
//  QueryRole,
//  StorageConfig,
//  StorageResult,
//  StorageType,
//  StorageValue,
//  UserRole,
//} from "./types";
//
//export class RedisStorage {
//  private client: RedisClientType | null = null;
//  private config: StorageConfig;
//
//  constructor() {
//    this.config = {
//      appName: process.env.REDIS_APP_NAME || "my-next-app",
//      ttl: {
//        session: 24 * 60 * 60, // 24 hours
//        cache: 2 * 60 * 60, // 2 hours
//        temp: 10 * 60, // 10 minutes
//      },
//    };
//  }
//
//  private async getClient(): Promise<RedisClientType> {
//    if (!this.client) {
//      this.client = await redisClient.getClient();
//    }
//    return this.client;
//  }
//
//  getTTL(type: StorageType): number {
//    return this.config.ttl[type];
//  }
//
//  generateKey(options: KeyOptions): string {
//    const { type, identifier, role } = options;
//    let key = `app:${this.config.appName}:${type}:`;
//
//    if (type === "session" && role) {
//      key += `${role}:${identifier}`;
//    } else {
//      key += identifier;
//    }
//
//    return key;
//  }
//
//  // Generic set method
//  async setValue<T extends StorageValue>(
//    type: StorageType,
//    role: StorageType extends "session" ? UserRole : QueryRole,
//    identifier: string,
//    value: T
//  ): Promise<StorageResult<boolean>> {
//    const key = this.generateKey({ type, role, identifier });
//    const ttl = this.getTTL(type);
//
//    try {
//      const client = await this.getClient();
//      const serializedValue = JSON.stringify(value);
//
//      await client.setEx(key, ttl, serializedValue);
//
//      return { success: true, data: true };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to set value: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  // Generic get method
//  async getValue<T>(
//    type: StorageType,
//    role: StorageType extends "session" ? UserRole : QueryRole,
//    identifier: string
//  ): Promise<StorageResult<T | null>> {
//    const key = this.generateKey({ type, role, identifier });
//
//    try {
//      const client = await this.getClient();
//      const value = await client.get(key);
//
//      if (value === null) {
//        return { success: true, data: null };
//      }
//
//      const parsedValue = JSON.parse(value) as T;
//      return { success: true, data: parsedValue };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to get value: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  // Delete single key method
//  async deleteValue(
//    type: StorageType,
//    role: StorageType extends "session" ? UserRole : QueryRole,
//    identifier: string
//  ): Promise<StorageResult<boolean>> {
//    const key = this.generateKey({ type, role, identifier });
//
//    try {
//      const client = await this.getClient();
//      const result = await client.del(key);
//      return { success: true, data: result > 0 };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to delete value: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  // Utility Methods
//  async exists(
//    type: StorageType,
//    identifier: string,
//    role: UserRole | QueryRole
//  ): Promise<StorageResult<boolean>> {
//    try {
//      const client = await this.getClient();
//      const key = this.generateKey({ type, identifier, role });
//      const exists = await client.exists(key);
//
//      return { success: true, data: exists === 1 };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to check existence: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  async getTTLRemaining(
//    type: StorageType,
//    identifier: string,
//    role: UserRole | QueryRole
//  ): Promise<StorageResult<number>> {
//    try {
//      const client = await this.getClient();
//      const key = this.generateKey({ type, identifier, role });
//      const ttl = await client.ttl(key);
//
//      return { success: true, data: ttl };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to get TTL: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  async clearAll(type?: StorageType): Promise<StorageResult<number>> {
//    try {
//      const client = await this.getClient();
//      let pattern = `app:${this.config.appName}:`;
//
//      if (type) {
//        pattern += `${type}:*`;
//      } else {
//        pattern += "*";
//      }
//
//      const keys = await client.keys(pattern);
//
//      if (keys.length === 0) {
//        return { success: true, data: 0 };
//      }
//
//      const result = await client.del(keys);
//      return { success: true, data: result };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to clear data: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  async getKeys(type?: StorageType): Promise<StorageResult<string[]>> {
//    try {
//      const client = await this.getClient();
//      let pattern = `app:${this.config.appName}:`;
//
//      if (type) {
//        pattern += `${type}:*`;
//      } else {
//        pattern += "*";
//      }
//
//      const keys = await client.keys(pattern);
//      return { success: true, data: keys };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Failed to get keys: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//
//  // Health check
//  async ping(): Promise<StorageResult<string>> {
//    try {
//      const client = await this.getClient();
//      const result = await client.ping();
//      return { success: true, data: result };
//    } catch (error) {
//      return {
//        success: false,
//        error: `Redis ping failed: ${
//          error instanceof Error ? error.message : "Unknown error"
//        }`,
//      };
//    }
//  }
//}
//
//// Export singleton instance
//export const redis = new RedisStorage();

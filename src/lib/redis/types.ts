//// Storage type definitions
//export type StorageType = "session" | "cache" | "temp";
//
//// User roles for session storage
//export type UserRole = "mod" | "admin";
//
//// Query roles for cache storage
//export type QueryRole =
//  | "mod"
//  | "admin"
//  | "customer"
//  | "delivery"
//  | "bottle_usage"
//  | "total_bottles"
//  | "miscellaneous"
//  | "other_expenses";
//
//// Key generation options
//export interface KeyOptions {
//  type: StorageType;
//  role: StorageType extends "session" ? UserRole : QueryRole;
//  identifier: string;
//}
//
//// Base storage value type
//export type StorageValue =
//  | string
//  | number
//  | boolean
//  | string[]
//  | number[]
//  | StorageObject
//  | StorageObject[];
//
//export interface StorageObject {
//  [key: string]: StorageValue | undefined;
//}
//
//// Redis client configuration
//export interface RedisConfig {
//  url?: string;
//  host?: string;
//  port?: number;
//  password?: string;
//  database?: number;
//  retryDelayOnFailover?: number;
//  maxRetriesPerRequest?: number;
//  lazyConnect?: boolean;
//}
//
//// Storage configuration
//export interface StorageConfig {
//  appName: string;
//  ttl: {
//    session: number; // 24 hours in seconds
//    cache: number; // 2 hours in seconds
//    temp: number; // 10 minutes in seconds
//  };
//}
//
//// Storage operation result
//export interface StorageResult<T = StorageValue> {
//  success: boolean;
//  data?: T;
//  error?: string;
//}

import type { AppConfig } from '../config.js';
import type { FonatRepository } from './types.js';
import { MemoryFonatRepository } from './memory.js';
import { MongoFonatRepository } from './mongo.js';

export function createRepository(config: AppConfig): FonatRepository {
  return config.PERSISTENCE_MODE === 'memory'
    ? new MemoryFonatRepository()
    : new MongoFonatRepository(config.MONGODB_URI, config.MONGODB_DB);
}
export * from './types.js';

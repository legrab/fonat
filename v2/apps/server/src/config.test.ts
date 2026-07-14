import { describe, expect, it } from 'vitest';
import { readConfig } from './config.js';

const productionBase = {
  NODE_ENV: 'production',
  PERSISTENCE_MODE: 'mongo',
  SESSION_SECRET: 'x'.repeat(48),
  WEB_ORIGIN: 'https://fonat.example',
  PUBLIC_BASE_URL: 'https://fonat.example',
  MONGODB_URI: 'mongodb://example/fonat',
  ASSET_PROFILE: 'hosted-restricted'
};

describe('configuration profiles', () => {
  it('parses explicit false feature toggles', () => {
    const config = readConfig({ ...productionBase, FEATURE_PROJECTS: 'false', ENABLE_SWAGGER: '0' });
    expect(config.FEATURE_PROJECTS).toBe(false);
    expect(config.ENABLE_SWAGGER).toBe(false);
  });

  it('fails closed for production memory persistence', () => {
    expect(() => readConfig({ ...productionBase, PERSISTENCE_MODE: 'memory' })).toThrow(
      'PERSISTENCE_MODE cannot be memory'
    );
  });

  it('permits the local Docker HTTP origin only for loopback hosts', () => {
    expect(() =>
      readConfig({
        ...productionBase,
        WEB_ORIGIN: 'http://localhost:3000',
        PUBLIC_BASE_URL: 'http://localhost:3000'
      })
    ).not.toThrow();
    expect(() =>
      readConfig({
        ...productionBase,
        WEB_ORIGIN: 'http://fonat.example',
        PUBLIC_BASE_URL: 'http://fonat.example'
      })
    ).toThrow('must use HTTPS');
  });
});

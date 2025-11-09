const { ProbeScheduler } = require('@/modules/probes/sdk/ProbeScheduler');
const { ProbeConfigLoader } = require('@/modules/probes/sdk/ProbeConfigLoader');
const { ProbeVersionManager } = require('@/modules/probes/sdk/ProbeVersionManager');

describe('ProbeScheduler', () => {
  it('derives a cron window with sane defaults', () => {
    const scheduler = new ProbeScheduler();
    const window = scheduler.deriveNextWindow({ type: 'cron', expression: '0 */2 * * *' });

    expect(window.type).toBe('cron');
    expect(window.expression).toBe('0 */2 * * *');
    expect(window.nextRunAt).toBeInstanceOf(Date);
  });

  it('falls back to cron when type is invalid', () => {
    const scheduler = new ProbeScheduler();
    const window = scheduler.deriveNextWindow({ type: 'invalid' });

    expect(window.type).toBe('cron');
    expect(window.expression).toBe(scheduler.defaultCron);
  });
});

describe('ProbeConfigLoader', () => {
  it('merges nested overlay properties', () => {
    const loader = new ProbeConfigLoader({ defaults: { retries: 3, http: { timeout: 5 } } });
    const merged = loader.merge({ http: { timeout: 10, agent: 'probe' } });

    expect(merged).toEqual({ retries: 3, http: { timeout: 10, agent: 'probe' } });
  });
});

describe('ProbeVersionManager', () => {
  it('throws when version is below minimum', () => {
    const manager = new ProbeVersionManager({ minimumVersion: '2.0.0' });
    expect(() => manager.assertCompatible('1.0.0')).toThrow('below the supported minimum');
  });

  it('suggests plan when behind target', () => {
    const manager = new ProbeVersionManager({ targetVersion: '3.1.0' });
    expect(manager.planUpgrade('3.0.0')).toEqual({ from: '3.0.0', to: '3.1.0' });
  });
});

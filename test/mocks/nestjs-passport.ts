export function AuthGuard(type?: string) {
  return class MockAuthGuard {
    canActivate(context: any) {
      return true;
    }
  };
}

export function PassportStrategy(Strategy: any, name?: string) {
  return class MockPassportStrategy {
    constructor(...args: any[]) {}
    validate(...args: any[]) {
      return {};
    }
  };
}

export class PassportModule {
  static register(options?: any) {
    return {
      module: PassportModule,
      providers: [],
      exports: [],
    };
  }
}

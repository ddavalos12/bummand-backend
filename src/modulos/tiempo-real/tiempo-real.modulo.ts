import { Global, Module } from '@nestjs/common';
import { TiempoRealGateway } from './tiempo-real.gateway';

@Global()
@Module({
  providers: [TiempoRealGateway],
  exports: [TiempoRealGateway],
})
export class TiempoRealModulo {}

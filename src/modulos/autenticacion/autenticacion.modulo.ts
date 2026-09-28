import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AutenticacionControlador } from './autenticacion.controlador';
import { AutenticacionServicio } from './autenticacion.servicio';
import { JwtEstrategia } from './jwt.estrategia';
import { UsuariosModulo } from '../usuarios/usuarios.modulo';

@Module({
  imports: [
    UsuariosModulo,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION_TIME', '30d') as any },
      }),
    }),
  ],
  controllers: [AutenticacionControlador],
  providers: [JwtEstrategia, AutenticacionServicio],
  exports: [JwtModule, PassportModule, AutenticacionServicio],
})
export class AutenticacionModulo {}

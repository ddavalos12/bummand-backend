import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AutenticacionControlador } from './autenticacion.controlador';
import { AutenticacionServicio } from './autenticacion.servicio';
import { JwtEstrategia } from './jwt.estrategia';
import { UsuariosModulo } from '../usuarios/usuarios.modulo';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@Module({
  imports: [
    UsuariosModulo,
    TypeOrmModule.forFeature([Becario, Usuario]),
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

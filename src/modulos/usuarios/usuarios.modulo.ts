import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entidades/usuario.entidad';
import { CorreoUsuario } from './entidades/correo-usuario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

import { UsuariosControlador } from './usuarios.controlador';
import { PerfilControlador } from './perfil.controlador';
import { UsuariosServicio } from './usuarios.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Becario, CorreoUsuario])],
  controllers: [UsuariosControlador, PerfilControlador],
  providers: [UsuariosServicio],
  exports: [TypeOrmModule, UsuariosServicio],
})
export class UsuariosModulo {}

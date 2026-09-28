import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashearContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, SALT_ROUNDS);
}

export async function compararContrasena(contrasena: string, hash: string): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}

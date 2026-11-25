/**
 * Autenticación. Cada función llama a un endpoint de AuthController.java
 * (backend: controller/AuthController.java, ruta base /api/v1/auth).
 *
 * @author Santiago Rivas
 */
import { peticion } from './cliente';

/** POST /auth/login → AuthController.login() → devuelve { token, tipo: "Bearer" } */
export const iniciarSesion = (correo, password) =>
  peticion('/auth/login', { metodo: 'POST', cuerpo: { correo, password } });

/** POST /auth/registro → AuthController.registrar() → crea un ASISTENTE sin verificar */
export const registrarse = (correo, password) =>
  peticion('/auth/registro', { metodo: 'POST', cuerpo: { correo, password } });

/** GET /auth/verificar/{token} → AuthController.verificar() */
export const verificarCorreo = (token) => peticion(`/auth/verificar/${encodeURIComponent(token)}`);

/** POST /auth/recuperar-password → AuthController.recuperar() (respuesta genérica) */
export const solicitarRecuperacion = (correo) =>
  peticion('/auth/recuperar-password', { metodo: 'POST', cuerpo: { correo } });

/** POST /auth/restablecer-password → AuthController.restablecer() */
export const restablecerPassword = (token, nuevaPassword) =>
  peticion('/auth/restablecer-password', { metodo: 'POST', cuerpo: { token, nuevaPassword } });

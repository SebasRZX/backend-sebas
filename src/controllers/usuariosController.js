// controllers/usuariosController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
 
const isProd = (process.env.NODE_ENV?.toLowerCase() === 'production');
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,   // true en prod con HTTPS, false en localhost
  path: '/',
};
 
// ====================== LOGIN ======================
const loginUsuario = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body || {};
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }
 
    const [rows] = await db.execute(
      `SELECT id, nombre, primer_apellido, segundo_apellido, usuario, contrasena, rol, estado
       FROM usuarios
       WHERE usuario = ? AND estado = 'activo'
       LIMIT 1`,
      [usuario]
    );
 
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
 
    const u = rows[0];
 
    // Valida que haya un hash bcrypt razonable
    if (!u.contrasena || typeof u.contrasena !== 'string' || u.contrasena.length < 20) {
      console.error('Contraseña en BD no es un hash bcrypt válido para usuario:', usuario);
      return res.status(500).json({ error: 'Contraseña no válida en el servidor' });
    }
 
    const coincide = await bcrypt.compare(contrasena, u.contrasena);
    if (!coincide) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
 
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Falta JWT_SECRET en variables de entorno');
      return res.status(500).json({ error: 'Configuración faltante (JWT)' });
    }
 
    const payload = { id: u.id, rol: u.rol, nombre: u.nombre, usuario: u.usuario };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
 
    res.cookie('token', token, { ...COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 });
    return res.status(200).json({ mensaje: 'Login exitoso' });
  } catch (error) {
    console.error('Error en /usuarios/login:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};
 
// ====================== VERIFICAR SESIÓN ======================
const verificarUsuario = (req, res) => {
  // req.usuario lo setea el authMiddleware al validar el JWT de la cookie
  return res.json({ usuario: req.usuario });
};
 
// ====================== LOGOUT ======================
const logoutUsuario = (req, res) => {
  // Usar exactamente las mismas opciones que al setear para garantizar que borre
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
};
 
// ====================== OBTENER USUARIOS ======================
const obtenerUsuarios = async (req, res) => {
  try {
    const { rol } = req.usuario || {};
    if (rol !== 'admin' && rol !== 'coordinador') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
 
    const [rows] = await db.execute(
      `SELECT id, nombre, primer_apellido, segundo_apellido, usuario, rol, estado, fecha_creacion
       FROM usuarios
       ORDER BY id DESC`
    );
 
    return res.json(rows);
  } catch (err) {
    console.error('Error en obtenerUsuarios:', err);
    return res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};
 
// ====================== CREAR USUARIO ======================
const crearUsuario = async (req, res) => {
  try {
    const { rol } = req.usuario || {};
    if (rol !== 'admin' && rol !== 'coordinador') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
 
    const {
      nombre,
      primer_apellido,
      segundo_apellido,
      usuario,
      contrasena,
      rol: rolNuevo,
      estado,
    } = req.body || {};
 
    if (!nombre || !primer_apellido || !usuario || !contrasena || !rolNuevo) {
      return res.status(400).json({ error: 'Datos insuficientes' });
    }
 
    // Evita usuarios duplicados
    const [dup] = await db.execute('SELECT id FROM usuarios WHERE usuario = ? LIMIT 1', [usuario]);
    if (dup.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
 
    const hashed = await bcrypt.hash(contrasena, 10);
 
    await db.execute(
      `INSERT INTO usuarios
        (nombre, primer_apellido, segundo_apellido, usuario, contrasena, rol, estado, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nombre, primer_apellido || '', segundo_apellido || '', usuario, hashed, rolNuevo, estado ?? 'activo']
    );
 
    return res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (err) {
    console.error('Error en crearUsuario:', err);
    return res.status(500).json({ error: 'Error al crear el usuario' });
  }
};
 
// ====================== ELIMINAR USUARIO ======================
const eliminarUsuario = async (req, res) => {
  try {
    const { rol } = req.usuario || {};
    if (rol !== 'admin' && rol !== 'coordinador') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
 
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
 
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
 
    return res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error en eliminarUsuario:', err);
    return res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
 
// ====================== EDITAR USUARIO ======================
const editarUsuario = async (req, res) => {
  try {
    const { rol } = req.usuario || {};
    if (rol !== 'admin' && rol !== 'coordinador') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
 
    const { id } = req.params;
    const {
      nombre,
      primer_apellido,
      segundo_apellido,
      usuario: nombreUsuario,
      contrasena,
      rol: rolNuevo,
      estado,
    } = req.body || {};
 
    // Construcción dinámica del UPDATE
    const fields = [];
    const params = [];
 
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (primer_apellido !== undefined) { fields.push('primer_apellido = ?'); params.push(primer_apellido); }
    if (segundo_apellido !== undefined) { fields.push('segundo_apellido = ?'); params.push(segundo_apellido); }
    if (nombreUsuario !== undefined) { fields.push('usuario = ?'); params.push(nombreUsuario); }
    if (rolNuevo !== undefined) { fields.push('rol = ?'); params.push(rolNuevo); }
    if (estado !== undefined) { fields.push('estado = ?'); params.push(estado); }
 
    if (contrasena && contrasena.trim() !== '') {
      const hashed = await bcrypt.hash(contrasena, 10);
      fields.push('contrasena = ?');
      params.push(hashed);
    }
 
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Sin cambios' });
    }
 
    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);
 
    const [result] = await db.execute(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
 
    return res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('Error en editarUsuario:', err);
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};
 
module.exports = {
  loginUsuario,
  verificarUsuario,
  logoutUsuario,
  obtenerUsuarios,
  crearUsuario,
  eliminarUsuario,
  editarUsuario,
};

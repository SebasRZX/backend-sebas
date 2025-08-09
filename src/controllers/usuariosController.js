const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
const loginUsuario = async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM usuarios WHERE usuario = ? AND estado = 'activo'`,
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const usuarioDB = rows[0];
    const coincide = await bcrypt.compare(contrasena, usuarioDB.contrasena);

    if (!coincide) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuarioDB.id, rol: usuarioDB.rol, nombre: usuarioDB.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.status(200).json({ mensaje: 'Login exitoso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Verificar sesión
const verificarUsuario = (req, res) => {
  res.json({ usuario: req.usuario });
};

// Logout
const logoutUsuario = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
  });
  res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
};

// Obtener usuarios
const obtenerUsuarios = async (req, res) => {
  const rol = req.usuario.rol;

  if (rol !== 'admin' && rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

// Crear usuario
const crearUsuario = async (req, res) => {
  const rol = req.usuario.rol;

  if (rol !== 'admin' && rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  const { nombre, primer_apellido, segundo_apellido, usuario, contrasena, rol: rolNuevo, estado } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    await db.execute(
      `INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, usuario, contrasena, rol, estado, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nombre, primer_apellido, segundo_apellido, usuario, hashedPassword, rolNuevo, estado]
    );

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  const rol = req.usuario.rol;

  if (rol !== 'admin' && rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  const { id } = req.params;

  try {
    await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

// Editar usuario
const editarUsuario = async (req, res) => {
  const { rol } = req.usuario;

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
    estado
  } = req.body;

  try {
    let query = `
      UPDATE usuarios SET
        nombre = ?,
        primer_apellido = ?,
        segundo_apellido = ?,
        usuario = ?,
        rol = ?,
        estado = ?
    `;
    const params = [
      nombre,
      primer_apellido,
      segundo_apellido,
      nombreUsuario,
      rolNuevo,
      estado
    ];

    if (contrasena && contrasena.trim() !== '') {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      query += `, contrasena = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await db.execute(query, params);

    res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
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

/**
 * @archivo documento-ejemplo.ts
 * @descripcion Documento de ejemplo que se carga inicialmente en el editor.
 * Demuestra las capacidades del DSL con un esquema de base de datos realista.
 */

/**
 * Código de ejemplo del DSL es-ldmd que demuestra las principales funcionalidades:
 * - Definición de tablas con y sin schema
 * - Tipos de datos en español
 * - Llaves primarias simples y compuestas
 * - Llaves foráneas con cascada
 * - Índices
 * - Notas en tablas y columnas
 * - Grupos
 */
export const DOCUMENTO_EJEMPLO = `// Sistema de gestión de una tienda en línea
// Este es un ejemplo del lenguaje de modelado es-ldmd

Tabla usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]
    correo texto(255) [no nulo, nota: 'Correo electrónico único del usuario']
    contrasena texto(255) [no nulo]
    fecha_registro fecha_hora [no nulo, por_defecto: \`NOW()\`]
    activo lógico [por_defecto: \`true\`]

    indices {
        correo
    }

    primaria {
        id
    }

    Nota: 'Tabla principal de usuarios del sistema'
}

Tabla categorias {
    id entero [incremento]
    nombre texto(50) [no nulo]
    descripcion texto

    primaria {
        id
    }
}

Tabla productos {
    id entero [incremento]
    nombre texto(200) [no nulo]
    descripcion texto
    precio decimal [no nulo]
    stock entero [no nulo, por_defecto: \`0\`]
    categoria_id entero [no nulo]
    fecha_creacion fecha_hora [por_defecto: \`NOW()\`]

    indices {
        nombre
        categoria_id
    }

    primaria {
        id
    }

    foranea {
        categoria_id categorias(id) [eliminación en cascada]
    }

    Nota: 'Catálogo de productos disponibles'
}

Tabla pedidos {
    id entero [incremento]
    usuario_id entero [no nulo]
    fecha fecha_hora [no nulo, por_defecto: \`NOW()\`]
    total decimal [no nulo]
    estado texto(20) [por_defecto: \`'pendiente'\`]

    indices {
        usuario_id
        fecha
    }

    primaria {
        id
    }

    foranea {
        usuario_id usuarios(id)
    }
}

Tabla detalle_pedidos {
    pedido_id entero [no nulo]
    producto_id entero [no nulo]
    cantidad entero [no nulo, por_defecto: \`1\`]
    precio_unitario decimal [no nulo]

    indices {
        pedido_id
        producto_id
    }

    primaria {
        pedido_id
        producto_id
    }

    foranea {
        pedido_id pedidos(id) [eliminación en cascada, actualización en cascada]
        producto_id productos(id)
    }
}

Grupo tienda {
    productos
    categorias
}

Grupo ventas {
    pedidos
    detalle_pedidos
}
`;

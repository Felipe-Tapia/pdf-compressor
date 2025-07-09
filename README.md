# Compresor de PDF

Una aplicación web moderna para comprimir archivos PDF de forma rápida y segura. **Optimizada para Vercel**.

## Características

- 🎨 Interfaz moderna y responsiva
- 📁 Arrastra y suelta archivos PDF
- 🔒 Procesamiento seguro en el servidor
- 📊 Estadísticas detalladas de compresión
- 💾 Descarga directa del archivo comprimido
- 📱 Compatible con dispositivos móviles
- ⚡ Optimizada para Vercel (sin dependencias externas)

## Niveles de Compresión

- **Baja**: Calidad máxima, compresión mínima
- **Media**: Balance entre calidad y tamaño
- **Alta**: Más compresión, calidad reducida
- **Extrema**: Máxima compresión posible con pdf-lib

## Despliegue

### Vercel (Recomendado)

1. **Fork este repositorio**
2. **Ve a [vercel.com](https://vercel.com)**
3. **Importa el repositorio**
4. **¡Listo! Tu app estará online**

### Local

```bash
npm install
npm start
```

## Tecnologías utilizadas

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Procesamiento PDF**: pdf-lib
- **Subida de archivos**: Multer
- **Plataforma**: Vercel

## Límites

- Tamaño máximo de archivo: 25MB (optimizado para Vercel)
- Solo archivos PDF
- Los archivos se procesan en el servidor

## Estructura del proyecto

```
pdf-compressor/
├── server.js          # Servidor Express
├── package.json       # Dependencias del proyecto
├── vercel.json        # Configuración para Vercel
├── public/
│   └── index.html     # Interfaz de usuario
├── uploads/           # Archivos subidos (se crea automáticamente)
└── compressed/        # Archivos comprimidos (se crea automáticamente)
```

## Licencia

MIT License

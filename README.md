# Compresor de PDF

Una aplicación web moderna para comprimir archivos PDF de forma rápida y segura.

## Características

- 🎨 Interfaz moderna y responsiva
- 📁 Arrastra y suelta archivos PDF
- 🔒 Procesamiento seguro en el servidor
- 📊 Estadísticas detalladas de compresión
- 💾 Descarga directa del archivo comprimido
- 📱 Compatible con dispositivos móviles

## Instalación

1. **Clona o descarga el proyecto**

   ```bash
   cd pdf-compressor
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   ```

3. **Inicia el servidor**

   ```bash
   npm start
   ```

4. **Abre tu navegador**
   Ve a `http://localhost:3000`

## Uso

1. **Sube tu archivo PDF**

   - Arrastra el archivo al área de subida
   - O haz clic para seleccionar el archivo

2. **Comprime el archivo**

   - Haz clic en "Comprimir PDF"
   - Espera a que se complete el proceso

3. **Descarga el resultado**
   - Revisa las estadísticas de compresión
   - Descarga el archivo comprimido

## Tecnologías utilizadas

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Procesamiento PDF**: pdf-lib
- **Subida de archivos**: Multer

## Estructura del proyecto

```
pdf-compressor/
├── server.js          # Servidor Express
├── package.json       # Dependencias del proyecto
├── public/
│   └── index.html     # Interfaz de usuario
├── uploads/           # Archivos subidos (se crea automáticamente)
└── compressed/        # Archivos comprimidos (se crea automáticamente)
```

## Límites

- Tamaño máximo de archivo: 50MB
- Solo archivos PDF
- Los archivos se procesan en el servidor

## Desarrollo

Para ejecutar en modo desarrollo con recarga automática:

```bash
npm run dev
```

## Licencia

MIT License

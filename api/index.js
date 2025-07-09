const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

const app = express();

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".pdf");
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB máximo para Vercel
  },
});

// Crear directorio para archivos comprimidos
const compressedDir = path.join(__dirname, "../compressed");
if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir, { recursive: true });
}

// Función para comprimir PDF usando solo pdf-lib
async function compressPDF(pdfBytes, compressionLevel) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Configurar opciones de compresión según el nivel
  let saveOptions = {
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  };

  switch (compressionLevel) {
    case "low":
      saveOptions.objectsPerTick = 50;
      saveOptions.useObjectStreams = true;
      break;
    case "medium":
      saveOptions.objectsPerTick = 20;
      saveOptions.useObjectStreams = true;
      break;
    case "high":
      saveOptions.objectsPerTick = 10;
      saveOptions.useObjectStreams = true;
      break;
    case "extreme":
      saveOptions.objectsPerTick = 5;
      saveOptions.useObjectStreams = true;
      break;
  }

  return await pdfDoc.save(saveOptions);
}

// Endpoint para subir y comprimir PDF
app.post("/compress", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    const compressionLevel = req.body.compressionLevel || "medium";
    const inputPath = req.file.path;
    const outputPath = path.join(
      compressedDir,
      `compressed-${req.file.filename}`
    );

    // Leer el archivo PDF
    const pdfBytes = fs.readFileSync(inputPath);

    // Comprimir usando pdf-lib
    const compressedPdfBytes = await compressPDF(pdfBytes, compressionLevel);

    // Guardar el archivo comprimido
    fs.writeFileSync(outputPath, compressedPdfBytes);

    // Calcular tamaños
    const originalSize = fs.statSync(inputPath).size;
    let compressedSize = 0;
    if (fs.existsSync(outputPath)) {
      compressedSize = fs.statSync(outputPath).size;
    }

    let finalPath = outputPath;
    let wasCompressed = true;

    // Si el archivo comprimido es más grande, devolver el original
    if (compressedSize === 0 || compressedSize >= originalSize) {
      finalPath = inputPath;
      compressedSize = originalSize;
      wasCompressed = false;
    }

    let ahorro = originalSize - compressedSize;
    if (ahorro < 0) ahorro = 0;
    let compressionRatio =
      originalSize > 0
        ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(2)
        : "0.00";

    // Enviar respuesta
    res.json({
      success: true,
      originalSize: originalSize,
      compressedSize: compressedSize,
      compressionRatio: compressionRatio,
      ahorro: ahorro,
      downloadUrl: `/download/${path.basename(finalPath)}`,
      filename: path.basename(finalPath),
      compressionLevel: compressionLevel,
      wasCompressed: wasCompressed,
      message: wasCompressed
        ? undefined
        : "No se pudo comprimir más el archivo. Se devuelve el original.",
    });
  } catch (error) {
    console.error("Error al comprimir PDF:", error);
    res
      .status(500)
      .json({ error: "Error al comprimir el archivo PDF: " + error.message });
  }
});

// Endpoint para descargar archivo comprimido
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(compressedDir, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// Endpoint para obtener información del servidor
app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    platform: "Vercel",
  });
});

// Endpoint raíz - servir la página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Para desarrollo local
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Para Vercel, necesitamos exportar la app
module.exports = app;

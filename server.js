const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { PDFDocument } = require("pdf-lib");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
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
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
});

// Crear directorio para archivos comprimidos
const compressedDir = "compressed";
if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir);
}

// Función para comprimir usando Ghostscript
function compressWithGhostscript(inputPath, outputPath, compressionLevel) {
  return new Promise((resolve, reject) => {
    let gsCommand;

    switch (compressionLevel) {
      case "low":
        gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/printer -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        break;
      case "medium":
        gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        break;
      case "high":
        gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
        break;
      case "extreme":
        gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -dColorImageResolution=72 -dGrayImageResolution=72 -dMonoImageResolution=72 -sOutputFile="${outputPath}" "${inputPath}"`;
        break;
      default:
        gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    }

    exec(gsCommand, (error, stdout, stderr) => {
      if (error) {
        console.log("Ghostscript error:", error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
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
    let usedGhostscript = false;
    let compressionError = null;

    // Intentar usar Ghostscript primero (más efectivo)
    try {
      let gsCommand;
      switch (compressionLevel) {
        case "low":
          gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/printer -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;
          break;
        case "medium":
          gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;
          break;
        case "high":
          gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -dColorImageResolution=100 -dGrayImageResolution=100 -dMonoImageResolution=100 -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;
          break;
        case "extreme":
          // Parámetros aún más agresivos
          gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -dColorImageDownsampleType=/Average -dColorImageResolution=50 -dGrayImageDownsampleType=/Average -dGrayImageResolution=50 -dMonoImageDownsampleType=/Subsample -dMonoImageResolution=50 -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;
          break;
        default:
          gsCommand = `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;
      }
      await new Promise((resolve, reject) => {
        exec(gsCommand, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            usedGhostscript = true;
            resolve();
          }
        });
      });
    } catch (error) {
      compressionError = error.message;
      // Fallback a pdf-lib
      const pdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      let saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      };
      switch (compressionLevel) {
        case "low":
          saveOptions.objectsPerTick = 50;
          break;
        case "medium":
          saveOptions.objectsPerTick = 20;
          break;
        case "high":
          saveOptions.objectsPerTick = 10;
          break;
        case "extreme":
          saveOptions.objectsPerTick = 5;
          break;
      }
      const compressedPdfBytes = await pdfDoc.save(saveOptions);
      fs.writeFileSync(outputPath, compressedPdfBytes);
    }

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
      usedGhostscript: usedGhostscript,
      wasCompressed: wasCompressed,
      compressionError: compressionError,
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
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

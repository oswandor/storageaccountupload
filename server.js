const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const cors = require('cors'); // Importa el paquete cors
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

// const accountName = 'almacenamientodearchiv';
// const sasToken = 'sp=racwdl&st=2024-09-11T19:39:16Z&se=2024-10-01T03:39:16Z&spr=https&sv=2022-11-02&sr=c&sig=IvRoiP%2BKvb7SbK07UD2LypODCEceEolyOIXAYZ7Bg1M%3D';

if (!accountName) throw Error('Azure Storage accountName not found');
if (!sasToken) throw Error('Azure Storage SAS token not found');

const blobServiceUri = `https://${accountName}.blob.core.windows.net/uploadfiles?`;
const blobServiceClient = new BlobServiceClient(`${blobServiceUri}?${sasToken}`, null);

const upload = multer({ dest: 'uploads/' });


const allowedOrigins = ['https://wapp-ucga3rgh4hnpy.azurewebsites.net', 'http://localhost:8081'];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.static('public'));



app.post('/upload', upload.single('file'), async (req, res) => {
  const containerName = 'uploadfiles';
  const blobName = req.file.originalname;
  const filePath = path.join(__dirname, req.file.path);

  try {
    const containerClient = await blobServiceClient.getContainerClient(containerName);
    const blobClient = await containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blobClient.uploadFile(filePath);

    console.log(`${filePath} uploaded successfully`, uploadBlobResponse.requestId);
    res.status(200).send('File uploaded successfully');
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file');
  }
});


// crear una ruta home para render el index.html 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
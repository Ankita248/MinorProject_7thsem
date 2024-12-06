const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// AssemblyAI API key
const apiKey = '3c2ddffff0254e018c1c1819bb1ab91b'; // Replace with your API key

// Middleware for parsing JSON
app.use(express.json());
app.use(express.static('public'));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to handle file upload and transcription
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    // Step 1: Upload file to AssemblyAI
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath);
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', fileData, {
      headers: { authorization: apiKey },
    });
    const audioUrl = uploadResponse.data.upload_url;

    // Step 2: Request transcription
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl },
      { headers: { authorization: apiKey } }
    );

    const transcriptId = transcriptResponse.data.id;

    // Step 3: Poll for transcription result
    let transcriptionResult;
    let isCompleted = false;
    while (!isCompleted) {
      const transcriptResult = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { authorization: apiKey } }
      );

      if (transcriptResult.data.status === 'completed') {
        transcriptionResult = transcriptResult.data.text;
        isCompleted = true;
      } else if (transcriptResult.data.status === 'failed') {
        return res.status(500).send({ error: transcriptResult.data.error });
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      }
    }

    // Cleanup: Remove the uploaded file
    fs.unlinkSync(filePath);

    // Send the transcription result to the client
    res.send({ transcription: transcriptionResult });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

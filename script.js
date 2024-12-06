document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const fileInput = document.getElementById('audioFile');
    const formData = new FormData();
    formData.append('audio', fileInput.files[0]);
  
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      if (data.transcription) {
        document.getElementById('transcription').innerText = data.transcription;
      } else {
        document.getElementById('transcription').innerText = 'Error: ' + data.error;
      }
    } catch (error) {
      document.getElementById('transcription').innerText = 'Error: ' + error.message;
    }
  });
  
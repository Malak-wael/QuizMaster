// filepath: c:\Users\sh\OneDrive\Desktop\Project\src\components\FileUpload.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUpload = ({ quizId }) => {
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const generateQuestions = () => {
    if (!file || !quizId) {
      alert('File or Quiz ID missing');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      const randomQuestions = lines.sort(() => 0.5 - Math.random()).slice(0, 5).map(line => {
        const parts = line.split('?');
        return {
          text: parts[0] + '?',
          correctAnswer: parts[1]?.trim() || 'Answer',
          type: 'text'
        };
      });
      axios.post('/api/questions/bulk', { quizId, questions: randomQuestions })
        .then(() => alert('Questions generated'))
        .catch(err => alert('Error: ' + err.message));
    };
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drop file here</p>
      </div>
      {file && <button onClick={generateQuestions}>Generate Questions</button>}
    </div>
  );
};
export default FileUpload;

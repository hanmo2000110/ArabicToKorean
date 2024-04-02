import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// const multer = require('multer');
// const multerGoogleStorage = require('multer-google-storage');

// const upload = multer({
//   storage: multerGoogleStorage.storageEngine({
//     bucket: 'arabictokorean',
//     projectId: 'arabictokorean',
//     keyFilename: 'website/secure/arabictokorean.json',
//     filename: (req, file, cb) => {
//       cb(null, `arabictokorean/${file.originalname}`);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

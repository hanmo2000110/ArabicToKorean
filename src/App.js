import React from 'react';
// import ReactDOM from 'react-dom';
import './App.css'; // CSS 파일을 import합니다.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { PDFDocument } from 'pdf-lib';
const https = require('https');
const fs = require('fs');
const jwt = require('jsonwebtoken');


const firebaseConfig = {
  apiKey: "AIzaSyDBf1NdgmuGbAojZu6MXUhVccDE1PI_0e8",
  authDomain: "arabictokorean.firebaseapp.com",
  projectId: "arabictokorean",
  storageBucket: "arabictokorean",
  messagingSenderId: "591421231546",
  appId: "1:591421231546:web:6b3dec92a2bc1ad082cd83"
};

initializeApp(firebaseConfig);
const { useState } = React;


const FileInfo = ({ uploadedInfo }) => (
  <ul className="preview_info">
    {Object.entries(uploadedInfo).map(([key, value]) => (
      <li key={key}>
        <span className="info_key">{key}</span>
        <span className="info_value">{value}</span>
      </li>
    ))}
  </ul>
);

const Logo = () => (
  <svg className="icon" x="0px" y="0px" viewBox="0 0 24 24">
    <path fill="transparent" d="M0,0h24v24H0V0z" />
    <path fill="#FF7043" d="M20.5,5.2l-1.4-1.7C18.9,3.2,18.5,3,18,3H6C5.5,3,5.1,3.2,4.8,3.5L3.5,5.2C3.2,5.6,3,6,3,6.5V19  c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V6.5C21,6,20.8,5.6,20.5,5.2z M12,17.5L6.5,12H10v-2h4v2h3.5L12,17.5z M5.1,5l0.8-1h12l0.9,1  H5.1z" />
  </svg>
);



const UploadBox = () => {
  const [isActive, setActive] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState(null);

  const handleDragStart = () => setActive(true);
  const handleDragEnd = () => setActive(false);
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const [file, setFile] = useState(null);

  const splitPDF = async (pdfBytes, pageCount, pdfDoc, splitPDFs) => {
    try {
      if (!pdfBytes) {
        console.error('PDF 파일을 읽을 수 없습니다.');
        return;
      }

      for (let i = 0; i < pageCount; i += 20) {
        const startPageIndex = i;
        const endPageIndex = Math.min(i + 20, pageCount);
        var pages = Array.from({ length: endPageIndex - startPageIndex }, (v, k) => k + startPageIndex);

        const splitDoc = await PDFDocument.create();
        const copiedPages = await splitDoc.copyPages(pdfDoc, pages);
        copiedPages.forEach((page) => splitDoc.addPage(page));
        const splitPDFBytes = await splitDoc.save();
        splitPDFs.push(splitPDFBytes);
      }

    } catch (error) {
      console.error('파일 분할 오류:', error);
      alert('파일 분할 중 오류가 발생했습니다.');
    }
    console.log(`번역된 파일: ${file.name}`);
  }

  const uploadPDF = async (splitPDFs, storage) => {
    try {
      // 분할된 PDF 업로드
      const uploadPromises = splitPDFs.map((pdfBytes, index) => {
        return new Promise((resolve, reject) => {
          var storageRef = ref(storage, `${index}_${file.name}`);
          var blob = new Blob([pdfBytes], { type: 'application/pdf' });
          uploadBytes(storageRef, blob).then((snapshot) => {
            console.log('Uploaded a file!');
            resolve();
          }).catch(reject);
        });
      });
      await Promise.all(uploadPromises);
      console.log("file upload finished");
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }

    console.log("file upload finished")
  }

  // Google Cloud Console에서 생성한 서비스 계정의 클라이언트 이메일
  const clientEmail = 'arabictokorean@gmail.com';

  // Google Cloud Console에서 다운로드한 서비스 계정의 비공개 키 파일의 경로
  const privateKeyFile = 'website/secure/client_secret_591421231546-pj6etp8u4a1ccuja1ltv1fjfflna4ama.apps.googleusercontent.com.json';

  // Google Cloud OAuth 2.0 토큰 엔드포인트
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  // 번역할 문서의 Cloud Storage URI
  // const documentUri = 'gs://your-bucket-name/your-file.pdf';

  async function getAccessToken() {
    const privateKey = fs.readFileSync(privateKeyFile, 'utf8');
    const jwtPayload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: tokenEndpoint,
      exp: Math.floor(Date.now() / 1000) + 3600, // 토큰 만료 시간 (현재 시간 + 1시간)
    };
    const signedJwt = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' });

    const requestBody = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(signedJwt)}`;

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response.access_token);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });
  }

  const translatePDF = async () => {
    const url = 'https://translation.googleapis.com/v3/projects/arabictokorean/locations/us-central1:translateDocument';
    const apiKey = "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";

    // const accessToken = await getAccessToken();

    const requestBody = {
      source_language_code: 'ar',
      target_language_code: 'ko',
      document_input_config: {
        gcsSource: {
          inputUri: 'gs://arabictokorean/'
        }
      },
      document_output_config: {
        gcsDestination: {
          outputUriPrefix: 'gs://arabictokorean/'
        }
      },
      isTranslateNativePdfOnly: false
    };

    var files = Array.from({ length: splitPDF.length }, (v, k) => `${k}_translated_${file.name}`);

    try {
      const translationPromises = files.map(async (file) => {
        try {
          requestBody.document_output_config = 'gs://arabictokorean/';
          const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
              // 'key': `${apiKey}`,
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const responseData = await response.json();
          console.log(responseData);
          // 번역 작업 성공한 경우 해당 파일명 반환
          return file;
        } catch (error) {
          console.error(`${file} 번역 중 오류 발생:`, error);
          // 오류 발생한 경우 null 반환
          return null;
        }
      });

      // 모든 번역 작업이 완료될 때까지 기다림
      const translatedFiles = await Promise.all(translationPromises);

      // 번역이 완료된 파일 출력
      console.log('번역이 완료된 파일:', translatedFiles.filter(file => file !== null));

      // 서버의 응답 데이터 출력
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const downloadPDF = async (pageCount, storage) => {
    console.log("file dowload start")
    try {
      const mergedPDFDocument = await PDFDocument.create();

      for (let i = 0; i < pageCount / 20; i += 1) {
        console.log(`${i}_translated_${file.name}`);
        var storageRef = ref(storage, `${i}_translated_${file.name}`);
        storageRef = ref(storage, storageRef);
        const url = await getDownloadURL(storageRef);
        const arrayBuffer = await fetch(url).then(response => response.arrayBuffer());
        const pdfDocument = (await PDFDocument.load(arrayBuffer));
        const pageCount = pdfDocument.getPageCount(); // 버그 발생
        for (let pageNumber = 0; pageNumber < pageCount; ++pageNumber) {
          const [copiedPage] = await mergedPDFDocument.copyPages(pdfDocument, [pageNumber]);
          mergedPDFDocument.addPage(copiedPage);
        }
      }
      console.log("다운로드 완료");
      await mergePDF(mergedPDFDocument);

    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  }

  const mergePDF = async (mergedPDFDocument) => {
    const mergedPDFBytes = await mergedPDFDocument.save();
    const mergedPDFBlob = new Blob([mergedPDFBytes], { type: 'application/pdf' });
    console.log("머지 완료");
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(mergedPDFBlob);
    downloadLink.download = `${file.name}_merged.pdf`;
    downloadLink.click();
    console.log("다운로드2 완료");
  }

  const handleTranslate = async () => {
    if (!file) {
      alert('파일을 업로드하세요.');
      return;
    }

    const splitPDFs = [];
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const storage = getStorage();

    await splitPDF(pdfBytes, pageCount, pdfDoc, splitPDFs);
    await uploadPDF(splitPDFs, storage);
    await translatePDF();
    await downloadPDF(pageCount, storage);

  };





  const setFileInfo = (file) => {
    const { name, size: byteSize, type } = file;
    const size = (byteSize / (1024 * 1024)).toFixed(2) + 'mb';
    setUploadedInfo({ name, size, type }); // name, size, type 정보를 uploadedInfo에 저장
    setFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setActive(false);

    const file = event.dataTransfer.files[0];
    setFileInfo(file);
  };

  const handleUpload = ({ target }) => {
    const file = target.files[0];
    setFileInfo(file);
  };

  return (
    <label
      className={`preview${isActive ? ' active' : ''}`}
      onDragEnter={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragEnd}
      onDrop={handleDrop}
    >
      <input type="file" className="file" onChange={handleUpload} />
      {uploadedInfo && <FileInfo uploadedInfo={uploadedInfo} />}
      {!uploadedInfo && (
        <>
          <Logo />
          <p className="preview_msg">클릭하거나 파일을 이 곳에 드래그하세요.</p>
          <p className="preview_desc">최대 3MB 파일까지 업로드할 수 있습니다.</p>
        </>
      )}
      <button onClick={handleTranslate}>번역하기</button>
    </label>

  );
};

function App() {
  return (
    <div className="App" >
      <h1 className="title">PDF file Translation</h1>
      <h2 className="title">Arabic to Korean</h2>
      <UploadBox />
    </div >
  );
}

// ReactDOM.render(<App />, document.getElementById('root'));

export default App;

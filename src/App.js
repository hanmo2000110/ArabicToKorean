import React from 'react';
// import ReactDOM from 'react-dom';
import './App.css'; // CSS 파일을 import합니다.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { PDFDocument } from 'pdf-lib';

const firebaseConfig = {
  apiKey: "AIzaSyDBf1NdgmuGbAojZu6MXUhVccDE1PI_0e8",
  authDomain: "lang-420412.firebaseapp.com",
  projectId: "lang-420412",
  storageBucket: "arabictokorean1",
  messagingSenderId: "59722107362",
  appId: "1:59722107362:web:6b3dec92a2bc1ad082cd83"
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
    localStorage.setItem('pdfLength', splitPDFs.length);
    console.log("splitPDFs length : " + splitPDFs.length)
  }


  const translatePDF = async () => {
    var pdfLength = localStorage.getItem('pdfLength');
    var files = Array.from({ length: pdfLength }, (v, k) => `gs://arabictokorean1/${k}_${file.name}`);
    try {
      console.log("power shell start");

      // 각 URI에 대한 요청 보내기
      const requests = files.map(async (uri) => {
          // 서버 URL
          const serverUrl = 'http://127.0.0.1:5000/update_input_uri';

          // JSON 데이터 생성
          const requestData = {
              new_input_uri: uri
          };

          // HTTP POST 요청 보내기
          return fetch(serverUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
          })
          .then(response => response.json())
          .then(data => {
              console.log('서버 응답:', data);
              // 성공적으로 요청을 보낸 후 실행할 코드
              return data;
          })
          .catch(error => {
              console.error('에러 발생:', error);
              // 요청 실패 시 실행할 코드
              throw error;
          });
      });

      // 모든 요청이 완료될 때까지 기다리기
      Promise.all(requests)
          .then(responses => {
              console.log('모든 요청 완료:', responses);
              // 모든 요청이 성공적으로 완료된 후 실행할 코드
          })
          .catch(error => {
              console.error('하나 이상의 요청 실패:', error);
              // 하나 이상의 요청이 실패했을 때 실행할 코드
          });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const downloadPDF = async (pageCount, storage) => {
    console.log("file dowload start")
    try {
      const mergedPDFDocument = await PDFDocument.create();

      for (let i = 0; i < pageCount / 20; i += 1) {
        console.log(`arabictokorean1/arabictokorean1_${i}_${file.name.replace(".pdf","")}_ko_translations.pdf`);
        var storageRef = ref(storage, `gs://arabictokorean1/arabictokorean1_${i}_${file.name.replace(".pdf","")}_ko_translations.pdf`);
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

  const handleTranslate = async (mode) => {
    if (!file) {
      alert('파일을 업로드하세요.');
      return;
    }

    const splitPDFs = [];
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const storage = getStorage();
    if(mode === "upload"){
      await splitPDF(pdfBytes, pageCount, pdfDoc, splitPDFs);
      await uploadPDF(splitPDFs, storage);
    }
    else if(mode === "translate"){
      await translatePDF();
    }
    else if(mode === "download"){
      await downloadPDF(pageCount, storage);
    }
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
    <>
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
      </label>
  
      <button onClick={() => handleTranslate("upload")}>업로드 하기</button>
      <button onClick={() => handleTranslate("translate")}>번역 하기</button>
      <button onClick={() => handleTranslate("download")}>다운로드 하기</button>
    </>
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

import React from 'react';
// import ReactDOM from 'react-dom';
import './App.css'; // CSS 파일을 import합니다.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { PDFDocument } from 'pdf-lib';


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

  const handleTranslate = async () => {
    if (!file) {
      alert('파일을 업로드하세요.');
      return;
    }

    const splitDoc = await PDFDocument.create();
    const splitPDFs = [];
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const storage = getStorage();
    var uploadFinished = true;

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

    try {
      // 분할된 PDF 업로드
      splitPDFs.forEach((pdfBytes, index) => {
        var storageRef = ref(storage, `${index}${file.name}`);
        var blob = new Blob([pdfBytes], { type: 'application/pdf' });
        uploadBytes(storageRef, blob).then((snapshot) => {
          console.log('Uploaded a file!');
          if (index == pageCount - 1)
            uploadFinished = false;
        });
      });
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }

    console.log("file upload finished")

    while (uploadFinished);

    console.log("file dowload start")
    try {
      const mergedPDFDocument = await PDFDocument.create();

      for (let i = 0; i < pageCount / 20; i += 1) {
        console.log(`${i}${file.name}`);
        var storageRef = ref(storage, `${i}${file.name}`);
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
      const mergedPDFBytes = await mergedPDFDocument.save();
      const mergedPDFBlob = new Blob([mergedPDFBytes], { type: 'application/pdf' });
      console.log("머지 완료");
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(mergedPDFBlob);
      downloadLink.download = `${file.name}_merged.pdf`;
      downloadLink.click();
      console.log("다운로드2 완료");
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
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

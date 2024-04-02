// cloudStorage.js

const { Storage } = require('@google-cloud/storage');

// Google Cloud Storage 클라이언트 생성
const storage = new Storage();

// 파일 업로드 함수 정의
const uploadFile = async (bucketName, filePath, destFileName, generationMatchPrecondition) => {
    try {
        // 업로드 옵션 설정
        const options = {
            destination: destFileName,
            preconditionOpts: { ifGenerationMatch: generationMatchPrecondition },
        };

        // 파일 업로드 실행
        await storage.bucket(bucketName).upload(filePath, options);
        console.log(`${filePath} uploaded to ${bucketName}`);
    } catch (error) {
        console.error('파일 업로드 오류:', error);
        throw error;
    }
};

module.exports = {
    uploadFile,
};

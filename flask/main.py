from flask import Flask, request, jsonify
import subprocess
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/update_input_uri', methods=['POST'])
def update_input_uri():
    try:
        # 요청에서 수정될 값을 받기
        new_input_uri = request.json.get('new_input_uri')

        # 수정될 값이 없는 경우 에러 반환
        if not new_input_uri:
            return jsonify({'error': '수정될 값이 요청에 없습니다.'}), 400


        # 파워쉘 스크립트 실행
        subprocess.run(['powershell', './translate.ps1', new_input_uri], check=True)
        
        return jsonify({'message': new_input_uri + '번역이 성공적으로 완료되었습니다.'})

    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'파워쉘 스크립트 실행 중 오류가 발생했습니다: {e.stderr}'}), 500

if __name__ == '__main__':
    app.run(debug=True)

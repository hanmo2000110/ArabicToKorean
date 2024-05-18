param(
    [string]$newInputUri  # 사용자로부터 받은 입력 URI
)

# JSON 데이터 정의
$jsonData = '{
    "source_language_code": "ar",
    "target_language_code": "ko",
    "document_input_config": {
        "gcsSource": {
            "inputUri": ""
        }
    },
    "document_output_config": {
        "gcsDestination": {
            "outputUriPrefix": "gs://arabictokorean1/"
        }
    },
    "isTranslateNativePdfOnly": false
}'

# JSON 데이터를 파싱하여 객체로 변환
$jsonObject = ConvertFrom-Json $jsonData

# 입력 URI를 JSON 데이터에 적용
$jsonObject.document_input_config.gcsSource.inputUri = $newInputUri

# gcloud 명령을 사용하여 액세스 토큰 가져오기
$cred = gcloud auth print-access-token

# 요청 헤더 설정
$headers = @{
    "Authorization" = "Bearer $cred"
    "x-goog-user-project" = "lang-420412"
}

# 요청 보내기
try {
    $response = Invoke-WebRequest `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body ($jsonObject | ConvertTo-Json -Depth 10) `
        -Uri "https://translation.googleapis.com/v3/projects/lang-420412/locations/us-central1:translateDocument"

    # 성공적인 응답인 경우
    if ($response.StatusCode -eq 200) {
        Write-Output "success\n"
    } else {
        Write-Output "오류 발생: $response.StatusCode\n"
    }
} catch {
    # 오류 발생 시 오류 메시지 출력
    Write-Output "error : $_"
}

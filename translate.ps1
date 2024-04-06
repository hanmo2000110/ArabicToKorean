$cred = gcloud auth print-access-token
$headers = @{ "Authorization" = "Bearer $cred"; "x-goog-user-project" = "arabictokorean" }

Invoke-WebRequest `
    -Method POST `
    -Headers $headers `
    -ContentType: "application/json; charset=utf-8" `
    -InFile request.json `
    -Uri "https://translation.googleapis.com/v3/projects/arabictokorean/locations/us-central1:translateDocument" | Select-Object -Expand Content
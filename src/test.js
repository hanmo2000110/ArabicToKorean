function main(parent, targetLanguageCode, documentInputConfig) {
    const { TranslationServiceClient } = require('@google-cloud/translate').v3beta1;

    const translationClient = new TranslationServiceClient();

    async function callTranslateDocument() {
        const request = {
            parent,
            targetLanguageCode,
            documentInputConfig,
        };

        const [response] = await translationClient.translateDocument(request);
        console.log('Translated document:');
        console.log(response.translatedDocument);
    }

    callTranslateDocument();
}

process.on('unhandledRejection', err => {
    console.error(err.message);
    process.exitCode = 1;
});

// Example usage:
// Replace 'your-parent-value' with the appropriate parent value
const parent = 'projects/arabictokorean/locations/us-central';
const targetLanguageCode = 'ko'; // Korean language code
const documentInputConfig = {
    gcsSource: {
        inputUri: 'gs://arabictokorean/0_tarikh_almaghrib.pdf' // Cloud Storage URI of your PDF file
    },
    mimeType: 'application/pdf'
};

main(parent, targetLanguageCode, documentInputConfig);

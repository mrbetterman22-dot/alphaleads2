
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function verify() {
    const key = process.env.GOOGLE_GENAI_API_KEY;
    console.log('Checking API Key:', key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'MISSING');

    if (!key) {
        console.error('ERROR: GOOGLE_GENAI_API_KEY is missing from process.env');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        console.log('Fetching available models via REST API...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(JSON.stringify(data.error));
        }

        console.log('Available Models:', data.models ? data.models.map((m: any) => m.name).join(', ') : 'None');

        // Try to find a flash model
        const flashModel = data.models?.find((m: any) => m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent'));

        if (flashModel) {
            console.log(`\nFound suitable Flash model: ${flashModel.name}`);
            const shortName = flashModel.name.replace('models/', '');
            console.log(`Testing generation with: ${shortName}`);

            const m = genAI.getGenerativeModel({ model: shortName });
            const r = await m.generateContent('Hello');
            await r.response;
            console.log(`SUCCESS: Model '${shortName}' works!`);
        } else {
            console.log('No "flash" model found in the list.');
        }
    } catch (error: any) {
        console.error('FAILURE: API Key check failed.');
        console.error('Error message:', error.message);
        if (error.message.includes('API key not valid')) {
            console.error('DIAGNOSIS: The key provided in .env is incorrect or revoked.');
        } else if (error.message.includes('404')) {
            console.error('DIAGNOSIS: Model not found (check model name).');
        }
        process.exit(1);
    }
}

verify();

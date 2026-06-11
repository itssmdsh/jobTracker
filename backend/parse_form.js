import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function parseForm() {
  const argUrl = process.argv[2];
  const defaultUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc3Es-Djcvftvh8EFZON0ZHMI7gJmd9ZCrkqu3lzjvI4hZftg/viewform';
  const inputUrl = argUrl || defaultUrl;

  // Normalize URL to /viewform and /formResponse
  const cleanUrl = inputUrl.split('?')[0].replace('/formResponse', '/viewform');
  const formSubmitUrl = cleanUrl.replace('/viewform', '/formResponse');

  console.log(`Fetching Google Form from: ${cleanUrl}...`);
  try {
    const res = await axios.get(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = res.data;
    const index = html.indexOf('FB_PUBLIC_LOAD_DATA_');
    if (index === -1) {
      throw new Error('Could not find FB_PUBLIC_LOAD_DATA_ in form HTML. Make sure the URL is a public Google Form view URL.');
    }
    let subStr = html.substring(index);
    const endSem = subStr.indexOf(';');
    let statement = subStr.substring(0, endSem);
    const equalIndex = statement.indexOf('=');
    let jsonExpr = statement.substring(equalIndex + 1).trim();
    
    const getPublicData = new Function(`return ${jsonExpr};`);
    const rawData = getPublicData();

    const items = rawData[1][1] || [];
    const entryMap = {};

    for (const item of items) {
      const title = item[1]; // question title
      const info = item[4] ? item[4][0] : null;
      if (info) {
        const entryId = info[0];
        if (entryId) {
          entryMap[title.trim()] = `entry.${entryId}`;
        }
      }
    }

    console.log('\n=============================================');
    console.log('Parsed Google Form Fields:');
    console.log(JSON.stringify(entryMap, null, 2));
    console.log('=============================================\n');

    // If parsing the registration form, update/write .env file
    if (cleanUrl.includes('1FAIpQLSc3Es-Djcvftvh8EFZON0ZHMI7gJmd9ZCrkqu3lzjvI4hZftg')) {
      const nameKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('name')) || '';
      const emailKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('email')) || '';
      const collegeKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('college') || k.toLowerCase().includes('university')) || '';
      const degreeKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('degree')) || '';
      const branchKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('branch') || k.toLowerCase().includes('specialization')) || '';
      const yopKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('yop') || k.toLowerCase().includes('passing')) || '';
      const techKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('tech') || k.toLowerCase().includes('stack')) || '';
      const discoveryKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('discover') || k.toLowerCase().includes('how did you')) || '';
      const confirmationKey = Object.keys(entryMap).find(k => k.toLowerCase().includes('confirmation') || k.toLowerCase().includes('consent') || k.toLowerCase().includes('agree')) || '';

      const envContent = `# Google Form Backend Configuration (Parsed Automatically)
VITE_GOOGLE_FORM_URL=${formSubmitUrl}
VITE_GOOGLE_FORM_NAME_ENTRY=${entryMap[nameKey] || ''}
VITE_GOOGLE_FORM_EMAIL_ENTRY=${entryMap[emailKey] || ''}
VITE_GOOGLE_FORM_COLLEGE_ENTRY=${entryMap[collegeKey] || ''}
VITE_GOOGLE_FORM_DEGREE_ENTRY=${entryMap[degreeKey] || ''}
VITE_GOOGLE_FORM_BRANCH_ENTRY=${entryMap[branchKey] || ''}
VITE_GOOGLE_FORM_YOP_ENTRY=${entryMap[yopKey] || ''}
VITE_GOOGLE_FORM_TECHSTACK_ENTRY=${entryMap[techKey] || ''}
VITE_GOOGLE_FORM_DISCOVERY_ENTRY=${entryMap[discoveryKey] || ''}
VITE_GOOGLE_FORM_CONFIRMATION_ENTRY=${entryMap[confirmationKey] || ''}
`;

      const envPath = path.join(__dirname, '../frontend/.env');
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`Successfully wrote registration environment variables to: ${envPath}`);
    } else {
      console.log('To configure this feedback form in your environments, set:');
      console.log(`VITE_GOOGLE_FORM_FEEDBACK_URL=${formSubmitUrl}`);
      for (const [key, val] of Object.entries(entryMap)) {
        console.log(`For field "${key}": set VITE_GOOGLE_FORM_FEEDBACK_XXX_ENTRY=${val}`);
      }
    }
  } catch (err) {
    console.error('Error parsing form:', err.message);
  }
}

parseForm();

/* -------------------------------------------------------------
    Hold on!
    This script is DANGEROUS

    DO NOT use this script in production environment.
    This script will DELETE EVERYTHING in Google Drive.

    Dangerous operation, please be careful to use.
-----------------------------------------------------------------*/

const { google } = require('googleapis');
const readline = require('readline');

// Google Drive API v3 setup
const KEYFILEPATH = './loyal-polymer-411002-b8ec065f71d9.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES
});
const drive = google.drive({ version: 'v3', auth });

async function listFiles() {
    const response = await drive.files.list({});
    const files = response.data.files;
    if (files.length === 0) {
        console.log('No files found.');
    } else {
        return files;
    }
}

async function deleteFile(fileId) {
    try {
        await drive.files.delete({ fileId });
        console.log(`File ${fileId} deleted.`);
    } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
    }
}

async function clearDrive() {
    try {
        const files = await listFiles();
        if (files && files.length > 0) {
            for (const file of files) {
                await deleteFile(file.id);
            }
            console.log('\x1b[105m%s\x1b[0m', `All files have been deleted.`);
        }
    } catch (error) {
        console.error('The API returned an error:', error);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


console.log('\x1b[95m%s\x1b[0m', `-------------------------------------------------------------`);
console.log('\x1b[31m%s\x1b[0m', `
                        Hold on!
                This script is DANGEROUS`);
console.log('\x1b[92m%s\x1b[0m', `
      DO NOT use this script in production environment.
     This script will DELETE EVERYTHING in Google Drive.`);
console.log('\x1b[96m%s\x1b[0m', `
                      You can use`);
console.log('\x1b[93m%s\x1b[0m', `
                "/delete?file_ID=xxxx"`);
console.log('\x1b[96m%s\x1b[0m', `
           At Broser to delete a single file.
            It's much safer than this script.`);
console.log('\x1b[36m%s\x1b[0m', `
    Dangerous operation, please be careful when you used.
                          :)`);
console.log('\x1b[95m%s\x1b[0m', `-------------------------------------------------------------`);



rl.question('\x1b[101mWARNING\x1b[0m \x1b[93mThis will delete ALL files in your Google Drive.\x1b[0m \n\n\x1b[104mType "DELETE" to confirm\x1b[0m: ', (answer) => {
    if (answer === 'DELETE') {
        clearDrive();
    } else if (answer === 'delete') {
        clearDrive();
    } else {
        console.log('\x1b[32m%s\x1b[0m', `Delete operation cancelled.`);
    }
    rl.close();
});



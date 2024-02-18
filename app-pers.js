const express = require('express'); // Web Framework
const multer = require('multer'); // For handling file uploads
const { google } = require('googleapis'); // Google API client library
const fs = require('fs');
const path = require('path');
const readline = require('readline'); // For reading user input
const SQL = require('sql-template-strings');
const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files(images)
const cors = require('cors');

// Allow cross-origin requests, use the default settings
app.use(cors());

// Load client secrets from local, DON'T SHARE THIS FILE!!!
const CREDENTIALS_PATH = './client_secret_392109503842-37oafhl6uh07ccq2i7vmv5a0lm1n1nr8.apps.googleusercontent.com.json';
const TOKEN_PATH = './token.json';

let oAuth2Client; // Define the OAuth2 client as a global variable
let drive; // Google Drive API client


// Create an OAuth 2 client
function authorize(credentials) {
    return new Promise((resolve, reject) => {
        const { client_secret, client_id, redirect_uris } = credentials;
        oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if have previously stored a token.
        if (fs.existsSync(TOKEN_PATH)) {
            const token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));

            // Initialize the Google Drive API instance
            drive = google.drive({ version: 'v3', auth: oAuth2Client });
            resolve(); // When the token is set, resolve the Promise
        } else {
            getAccessToken(oAuth2Client);
            resolve(); // After getting the token, resolve the Promise
        }
    });
}

// When the server starts, initialize the folder structure and load it
async function start() {
    try {
        const content = fs.readFileSync(CREDENTIALS_PATH);
        const credentials = JSON.parse(content);
        if (!credentials.web) {
            console.error('Missing "web" field in credentials');
            return;
        }
        await authorize(credentials.web); // Waiting for the Promise to resolve
        await initAndLoadFolders(); // Then initialize and load the folders
        console.log("Folders initialized and loaded.");
    } catch (error) {
        console.error("Error starting the app:", error);
    }
}

start(); // Start the app


function executeQuery(sql, callback=false) {
    console.log(sql)
    return new Promise((res, rej) => {
        pool.query(sql, function (error, results, fields) {
            console.log(results)
            if (error) {
                if (callback) {
                    rej(callback(error, null))
                }
                else {
                    rej([error, null])
                }
                console.log("ERROR: " + String(error))
                throw new Error()
            } else {
                if (callback) {
                    res(callback(null, results))
                }
                else {
                    console.log(res([null, results]))
                }
            }
        })
    })
}

// Get the access token and store it to the file
function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token as a JSON
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('Token stored to', TOKEN_PATH);
        });
    });
}

// Load client secrets from a local file and create an OAuth2 client
// Recall the authorize function in the fs.readFile callback
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    // Parse the credentials and handle errors
    let credentials;
    try {
        credentials = JSON.parse(content);
    } catch (parseErr) {
        console.error('Error parsing credentials:', parseErr);
        return;
    }

    // Check and use the web field
    if (!credentials.web) {
        console.error('Missing "web" field in credentials');
        return;
    }
    authorize(credentials.web); // Doesn't return a Promise, so no need to await
    // const drive = google.drive({ version: 'v3', auth: oAuth2Client });
});


// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (code) {
        try {
            // Use the code to get the access token
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            // Initialize the drive again, because now oAuth2Client has the token
            // drive = google.drive({ version: 'v3', auth: oAuth2Client });

            // Initialize and load the folders structure
            initAndLoadFolders();

            // Can choose to save the token to a file
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            console.log('Token stored to', TOKEN_PATH);

            res.send('Authentication successful! You can close this tab.');
        } catch (error) {
            console.error('Error retrieving access token', error);
            res.status(500).send('Authentication failed');
        }
    } else {
        res.status(400).send('Invalid request, missing authorization code');
    }
});
// console.log("Drive object before calling findOrCreateFolder:", drive);




// const FOLDER_ID = 'Folder ID'; // Folder ID
// const FolderName = 'scoutify'; // Folder Name

// Define the folder names
const rootFolderName = 'scoutify';
const subFolderNames = ['Drive Train', 'Full Robot'];
const userEmails = ['admin@kjchmc.cn']; // Users' email addresses that need to add edit permission, can be multiple, separated by comma, e.g. ['user1@xxx.com', 'user2@xxx.com'], 'akahn@beachwoodstudents.org'

// Store the folder structure in a global variable
let folderStructure = {};
const folderStructureFilePath = './folderStructure.json';


// When the server starts, initialize the folder structure and load it
async function initFolders() {
    try {
        const rootFolderId = await findOrCreateFolder(rootFolderName, null);
        folderStructure['root'] = { name: rootFolderName, id: rootFolderId };

        for (const name of subFolderNames) {
            const folderId = await findOrCreateFolder(name, rootFolderId);
            folderStructure[name] = { name, id: folderId };
        }

        fs.writeFileSync(folderStructureFilePath, JSON.stringify(folderStructure, null, 2));
    } catch (error) {
        console.error("Error initializing folders:", error);
    }
}


// Check if the folder exists on Google Drive, if not, create it
async function validateAndCreateFolders() {
    if (!drive) {
        console.error("Drive API client is not initialized.");
        return;
    }
    try {
        const rootFolderId = await validateFolder(rootFolderName, null);
        folderStructure['root'] = { name: rootFolderName, id: rootFolderId };

        for (const subFolderName of subFolderNames) {
            const subFolderId = await validateFolder(subFolderName, rootFolderId);
            folderStructure[subFolderName] = { name: subFolderName, id: subFolderId };
        }
        fs.writeFileSync(folderStructureFilePath, JSON.stringify(folderStructure, null, 2));
    } catch (error) {
        console.error("Error during validating and creating folders:", error);
    }
}


// Check if a single file exists on Google Drive, if not, create it
async function validateFolder(folderName, parentId) {
    if (folderStructure[folderName] && folderStructure[folderName].id) {
        const folderId = folderStructure[folderName].id;
        if (await isFolderExists(folderId)) {
            return folderId;
        }
    }
    console.log(`Folder not found or not specified: ${folderName}, creating new one.`);
    return await findOrCreateFolder(folderName, parentId);
}

// Check if the folder exists on Google Drive
async function isFolderExists(folderId) {
    if (!drive) {
        console.error("Drive API client is not initialized.");
        return false;
    }
    try {
        const response = await drive.files.get({ fileId: folderId, fields: 'trashed' });
        return !response.data.trashed; // Check if the folder is at trashed
    } catch (error) {
        if (error.code === 404) {
            return false; // Folder not defined
        } else {
            console.error(`Error checking if folder exists: ${error.message}`);
            throw error;
        }
    }
}


// Load the folder structure from a local JSON file
function loadFolderStructure() {
    if (fs.existsSync(folderStructureFilePath)) {
        const data = fs.readFileSync(folderStructureFilePath, 'utf8');
        folderStructure = JSON.parse(data);
    } else {
        console.error('Folder structure file not found.');
    }
}



// When the server starts, initialize the folder structure and load it
async function initAndLoadFolders() {
    // Check if the folder structure JSON file exists
    if (!fs.existsSync(folderStructureFilePath)) {
        console.log("Folder structure file not found. Creating folders...");
        // Initialize the folder structure
        await initFolders();
    } else {
        console.log("Loading existing folder structure from file...");
        loadFolderStructure(); // Loading the folder structure from the local JSON file

        // Validate and (if necessary) create the folders
        await validateAndCreateFolders();
    }
    console.log("Folders initialized and loaded.");
}



// Determine the MIME type of the uploaded file
function getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        default:
            return 'application/octet-stream'; // Commonly used for binary files
    }
}

// Check and set folder permissions
async function setFolderPermissions(folderId) {
    for (const email of userEmails) {
        try {
            await drive.permissions.create({
                fileId: folderId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: email,
                },
            });
        } catch (error) {
            // console.error(`为邮箱 ${email} 设置权限时出错:`, error);
            console.error(`Error setting permission for email ${email}:`, error);
        }
    }
}

// Find or create a folder on Google Drive and return the folder ID
async function findOrCreateFolder(folderName, parentId = null) {
    if (!drive) {
        console.error("Google Drive API client is not initialized.");
        return null;
    }
    const query = parentId
        ? `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents`
        : `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`;

    try {
        const response = await drive.files.list({
            q: query,
            spaces: 'drive',
            fields: 'files(id, name)',
        });

        if (response.data.files.length > 0) {
            console.log(`Folder '${folderName}' already exists: ${response.data.files[0].id}`);
            return response.data.files[0].id;
        } else {
            console.log(`Folder '${folderName}' not found, creating new one.`);
            const fileMetadata = {
                'name': folderName,
                'mimeType': 'application/vnd.google-apps.folder',
                ...(parentId && { 'parents': [parentId] })
            };
            const folder = await drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            console.log(`Folder '${folderName}' created: ${folder.data.id}`);
            return folder.data.id;
        }
    } catch (error) {
        console.error(`Error in findOrCreateFolder for '${folderName}': ${error.message}`);
        throw error;
    }
}
// console.log("Drive object:", drive);


// Upload the file to Google Drive and set permissions
async function uploadFileAndSetPermissions(filePath, originalName, folderType) {

    // Make sure to use the folderType parameter here
    const folderId = folderStructure[folderType]?.id || folderStructure['root'].id;
    console.log(`Uploading to folder: ${folderType}, Folder ID: ${folderId}`);

    try {
        // Get the folder ID based on the file type
        const folderId = folderStructure[folderType]?.id || folderStructure['root'].id;
        const mimeType = getMimeType(filePath);

        // Upload the file to the folder
        const fileMetadata = {
            name: originalName,
            parents: [folderId],
        };
        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(filePath),
        };
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        // Set the file permissions
        await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
        for (const email of userEmails) {
            await drive.permissions.create({
                fileId: file.data.id,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: email,
                },
            });
        }

        return file.data;
    } catch (error) {
        console.error('An error when upload the image(s):', error);
        throw new Error('Upload image(s) failed');
    }
}




// Upload file route
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    // 根据上传的文件类型选择文件夹
    // Determine the folder based on the file type

    // let folderName;
    // switch (req.query.type) {
    //     case 'full_robot':
    //         folderName = 'Full Robot';
    //         break;
    //     case 'drive_train':
    //         folderName = 'Drive Train';
    //         break;
    //     default:
    //         folderName = 'scoutify';
    // }

    const folderType = req.query.type || 'root'; // Use the query parameter as the folder type
    const formattedFolderType = formatFolderType(folderType); // Format the folderType

    try {
        await initAndLoadFolders(); // Make sure the folder structure is initialized and loaded with the latest data
        const driveResponse = await uploadFileAndSetPermissions(file.path, file.originalname, formattedFolderType);
        fs.unlinkSync(file.path); // Delete the temporary storge file when upload complete
        res.send({ fileId: driveResponse.id, webViewLink: driveResponse.webViewLink });
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        res.status(500).send('Error uploading file to Google Drive');
    }
});

// Format the folder type, e.g. 'full_robot' => 'Full Robot'
function formatFolderType(folderType) {

    // Convert 'full_robot' to 'Full Robot'
    if (folderType === 'full_robot') {
        return 'Full Robot';
    } else if (folderType === 'drive_train') {
        return 'Drive Train';
    }
    return 'root'; // Default to the 'root' folder
}



// Add new router become the index page
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// List files API router with JSON response
app.get('/list-files', async (req, res) => {
    try {
        const files = await listFiles(auth);
        res.json(files); // Return the file list as JSON format
    } catch (err) {
        console.error('The API returned an error during get the files list:', err);
        res.status(500).send('Error fetching file list');
    }
});


// Create a new router for show the list page(Front-end)
app.get('/list.html', async (req, res) => {
    const files = await listFiles(auth);
    // console.log(files); // Print the file list in console, for debug
    res.sendFile(path.join(__dirname, 'list.html'));
});


// List files in the user's Google Drive
async function listFiles(auth) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const response = await drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, webViewLink)', // Return the file ID, name and webViewLink
        });
        return response.data.files;
    } catch (err) {
        console.error('The API returned an error during get the files list:', err);
        return [];
    }
}


// Delete file route
app.get('/delete', async (req, res) => {
    const fileId = req.query.file_ID; // Get the file ID from the query parameter
    if (!fileId) {
        return res.status(400).send('No file ID provided');
    }

    try {
        await drive.files.delete({ fileId: fileId });
        console.log(`File with ID: ${fileId} has been deleted.`);
        res.send(`File with ID: ${fileId} has been deleted.`);
    } catch (error) {
        console.error('Error deleting file from Google Drive:', error);
        res.status(500).send('Error deleting file from Google Drive');
    }
});


// 删除文件的函数 (危险操作, 慎用!!!)
// Delete file function (Dangerous operation, use with caution!!!)

/*
async function deleteFile(fileId) {
    try {
        await drive.files.delete({
            fileId: fileId
        });
        console.log(`文件 ${fileId} 已被删除`);
    } catch (error) {
        console.error('删除文件时出错:', error);
        throw new Error('文件删除失败');
    }
}
 
// 示例用法
// Example usage

const fileToDelete = '要删除的文件ID'; // 替换为要删除的文件ID
deleteFile(fileToDelete);
*/





// --------------------------------------------
// 
//                   Database
// 
// --------------------------------------------
const mysql = require('mysql');
const dbConfig = require('./config/DBConfig'); //   Import the database configuration
const bodyParser = require('body-parser');
let pool;

// console.log(dbConfig);

app.use(bodyParser.json());

// const connection = mysql.createConnection(dbConfig);
pool = mysql.createPool(dbConfig);
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    }
    if (connection) connection.release();
    return;
})

// Connect to the database
/*
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});
*/



// API endpoint to receive data and store it in the database
app.post('/submit-form', async (req, res) => {
    console.log("RECIEVED REQUEST")
    const formData = req.body;

    // 处理 additionalComments 字段，保留换行符
    if (formData.additionalComments) {
        // 确保换行符被保留，这里不需要转换，直接保存即可
        formData.additionalComments = formData.additionalComments.replace(/\r\n/g, '\n');
    }

    // Output the form data for debugging
    // console.log('Received form data:', formData);

    // Handle fields that may be NULL or empty arrays
    Object.keys(formData).forEach(key => {
        if (formData[key] === null || formData[key] === undefined) {
            formData[key] = ''; // Convert NULL/undefined to an empty string
        } else if (Array.isArray(formData[key]) && formData[key].length === 0) {
            formData[key] = JSON.stringify(formData[key]); // Convert an empty array to an empty string
        }
    });

    // Build the SQL query
    // const columns = Object.keys(formData).map(key => key).join(', ');
    // const placeholders = Object.keys(formData).map(() => '?').join(', ');
    const query = SQL`INSERT INTO survey_responses (
        Event,
        Team_Number,
        Drive_Train_Type, 
        Wheel_Type, 
        Intake_Type, 
        Scoring_Locations, 
        Robot_Weight, 
        Robot_Length, 
        Robot_Width, 
        Robot_Height, 
        Drive_Team_Members,
        Maneuverability, 
        Practice_Hours, 
        Additional_Comments, 
        Full_Robot_ImgId, 
        Drive_Train_ImgId) VALUES (
        ${formData.Event},
        ${formData.Team_Number},
        ${formData.Drive_Train_Type}, 
        ${formData.Wheel_Type}, 
        ${formData.Intake_Type}, 
        ${formData.Scoring_Locations}, 
        ${formData.Robot_Weight}, 
        ${formData.Robot_Length}, 
        ${formData.Robot_Width}, 
        ${formData.Robot_Height}, 
        ${formData.Drive_Team_Members}, 
        ${formData.Maneuverability},
        ${formData.Practice_Hours}, 
        ${formData.Additional_Comments}, 
        ${formData.Full_Robot_ImgId}, 
        ${formData.Drive_Train_ImgId}
        )`;

    // Execute the SQL query
    try {
        await executeQuery(query); 
        res.send('Data saved successfully');
      } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
      }
});

// app.post('/submit-form', upload.none(), (req, res) => {
//     const formData = req.body;
//     if (Object.keys(formData).length === 0) {
//         return res.status(400).send('No data received');
//     }

//     console.log('Received form data:', formData);

//     // Build the SQL statement
//     const columns = Object.keys(formData).map(key => `\`${key}\``).join(', ');
//     const placeholders = Object.keys(formData).map(() => '?').join(', ');
//     const query = `INSERT INTO survey_responses (${columns}) VALUES (${placeholders})`;
//     const values = Object.values(formData);

//     connection.query(query, values, (err, result) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).send('Server error');
//         }
//         res.send('Data saved successfully');
//     });
// });



const stream = require('stream');


// Google Drive image proxy route
// This function will spend much more flow, so it's not recommended to use in production environment
app.get('/drive-image/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const driveResponse = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, { responseType: 'stream' });

        res.setHeader('Content-Type', 'image/jpeg'); // Change the MIME type to the actual file type if needed
        driveResponse.data
            .on('end', () => console.log('Done streaming file.'))
            .on('error', err => {
                console.error('Error streaming file.', err);
                res.status(500).send('Error streaming file');
            })
            .pipe(res);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).send('Error fetching file');
    }
});

app.get("/", (req, res) => {
    console.log("recieved")
    return res.send("hello")
})

app.get('/teams', (req, res) => {
    const query = req.query.query; // 获取查询参数
    fs.readFile('teams.json', (err, data) => {
      if (err) {
        res.status(500).send('Error reading the JSON file');
        return;
      }
      const teams = JSON.parse(data);
      // 如果有查询参数，过滤 JSON 数据；否则返回全部数据
      const filteredTeams = query
        ? teams.filter(team =>
            team.tm_name.toLowerCase().includes(query.toLowerCase())
          )
        : teams;
  
      res.json(filteredTeams); // 发送过滤后的数据
    });
  });
  











// Start the server
// const PORT = 3000;
const PORT = process.env.PORT || 39390; // Use the environment port if it's set
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
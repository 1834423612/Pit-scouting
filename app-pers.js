const express = require('express'); // Web框架
const multer = require('multer'); // 处理文件上传
const { google } = require('googleapis'); // Google API客户端库
const fs = require('fs');
const path = require('path');
const readline = require('readline'); // 用于获取用户输入

const app = express();
const upload = multer({ dest: 'uploads/' }); // 上传文件的临时目录
const cors = require('cors');

// 使用默认的 CORS 配置
app.use(cors());


// 加载客户端秘钥
const CREDENTIALS_PATH = './client_secret_392109503842-37oafhl6uh07ccq2i7vmv5a0lm1n1nr8.apps.googleusercontent.com.json';
const TOKEN_PATH = './token.json';

let oAuth2Client; // 定义为全局变量
let drive; // Google Drive API实例，全局变量


// 创建一个OAuth 2客户端
function authorize(credentials) {
    return new Promise((resolve, reject) => {
        const { client_secret, client_id, redirect_uris } = credentials;
        oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // 检查是否已经有了令牌
        if (fs.existsSync(TOKEN_PATH)) {
            const token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));

            // 初始化Google Drive API实例
            drive = google.drive({ version: 'v3', auth: oAuth2Client });
            resolve(); // 当初始化完成时，解决 Promise
        } else {
            getAccessToken(oAuth2Client);
            resolve(); // 在获取新令牌后解决 Promise
        }
    });
}

// 在服务器启动时初始化文件夹结构并加载
async function start() {
    try {
        const content = fs.readFileSync(CREDENTIALS_PATH);
        const credentials = JSON.parse(content);
        if (!credentials.web) {
            console.error('Missing "web" field in credentials');
            return;
        }
        await authorize(credentials.web); // 等待授权完成
        await initAndLoadFolders(); // 然后初始化和加载文件夹
        console.log("Folders initialized and loaded.");
    } catch (error) {
        console.error("Error starting the app:", error);
    }
}

start(); // 启动应用




// 获取访问令牌
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
            // 存储令牌到文件
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('Token stored to', TOKEN_PATH);
        });
    });
}

// 加载客户端秘钥并创建认证客户端
// 在fs.readFile回调中调用authorize函数
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    // 解析credentials和错误处理
    let credentials;
    try {
        credentials = JSON.parse(content);
    } catch (parseErr) {
        console.error('Error parsing credentials:', parseErr);
        return;
    }

    // 检查并使用web字段
    if (!credentials.web) {
        console.error('Missing "web" field in credentials');
        return;
    }
    authorize(credentials.web); // 不再返回oAuth2Client
    // const drive = google.drive({ version: 'v3', auth: oAuth2Client });
});


// OAuth2回调路由
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (code) {
        try {
            // 使用授权码获取访问令牌
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            // 再次初始化drive，因为现在oAuth2Client有了令牌
            // drive = google.drive({ version: 'v3', auth: oAuth2Client });

            // 初始化文件夹结构
            initAndLoadFolders();

            // 可以选择将令牌保存到文件中
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




// const FOLDER_ID = '文件夹ID'; // 文件夹ID
// const FolderName = 'scoutify'; // 文件夹名称
// 定义文件夹名称
const rootFolderName = 'scoutify';
const subFolderNames = ['Drive Train', 'Full Robot'];
const userEmails = ['admin@kjchmc.cn']; // 需要添加编辑权限的用户邮箱, 可以是多个, 用逗号分隔, 例如：['user1@xxx.com', 'user2@xxx.com'], 'akahn@beachwoodstudents.org'

// 全局变量来存储文件夹结构
let folderStructure = {};
const folderStructureFilePath = './folderStructure.json';


// 在服务器启动时初始化文件夹结构并加载
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


// 验证文件夹是否存在于Google Drive上，如果不存在则创建
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


// 验证单个文件夹是否存在，如果不存在则创建
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

// 检查文件夹是否存在于Google Drive上
async function isFolderExists(folderId) {
    if (!drive) {
        console.error("Drive API client is not initialized.");
        return false;
    }
    try {
        const response = await drive.files.get({ fileId: folderId, fields: 'trashed' });
        return !response.data.trashed; // 检查文件夹是否被放入回收站
    } catch (error) {
        if (error.code === 404) {
            return false; // 文件夹不存在
        } else {
            console.error(`Error checking if folder exists: ${error.message}`);
            throw error;
        }
    }
}


// 从本地JSON文件加载文件夹结构
function loadFolderStructure() {
    if (fs.existsSync(folderStructureFilePath)) {
        const data = fs.readFileSync(folderStructureFilePath, 'utf8');
        folderStructure = JSON.parse(data);
    } else {
        console.error('Folder structure file not found.');
    }
}



// 在服务器启动时初始化文件夹结构并加载
async function initAndLoadFolders() {
    // 检查是否已有文件夹结构JSON文件
    if (!fs.existsSync(folderStructureFilePath)) {
        console.log("Folder structure file not found. Creating folders...");
        // 没有文件夹结构JSON文件，初始化文件夹结构
        await initFolders();
    } else {
        console.log("Loading existing folder structure from file...");
        loadFolderStructure(); // 加载现有的文件夹结构
        // 验证并（如有必要）创建文件夹
        await validateAndCreateFolders();
    }
    console.log("Folders initialized and loaded.");
}



// 识别上传文件的MIME类型
function getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        default:
            return 'application/octet-stream'; // 通用的文件类型
    }
}

// 检查并设置文件夹权限
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
            console.error(`为邮箱 ${email} 设置权限时出错:`, error);
        }
    }
}

// 查找文件夹, 不存在则创建, 并返回文件夹ID
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


// 上传文件并设置权限
async function uploadFileAndSetPermissions(filePath, originalName, folderType) {
    // 确保这里使用 folderType 参数
    const folderId = folderStructure[folderType]?.id || folderStructure['root'].id;
    console.log(`Uploading to folder: ${folderType}, Folder ID: ${folderId}`);

    try {
        // 根据文件类型获取对应文件夹ID
        const folderId = folderStructure[folderType]?.id || folderStructure['root'].id;
        const mimeType = getMimeType(filePath);

        // 上传文件到该文件夹
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

        // 设置文件权限
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




// 上传文件的路由
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded');
    }

    // 根据上传的文件类型选择文件夹
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

    const folderType = req.query.type || 'root'; // 使用查询参数确定文件夹类型
    const formattedFolderType = formatFolderType(folderType); // 格式化 folderType

    try {
        await initAndLoadFolders(); // 确保文件夹信息是最新的
        const driveResponse = await uploadFileAndSetPermissions(file.path, file.originalname, formattedFolderType);
        fs.unlinkSync(file.path); // Delete the temporary storge file when upload complete
        res.send({ fileId: driveResponse.id, webViewLink: driveResponse.webViewLink });
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        res.status(500).send('Error uploading file to Google Drive');
    }
});

// 格式化文件夹类型, 例如: 'full_robot' => 'Full Robot'
function formatFolderType(folderType) {
    // 将 'full_robot' 转换为 'Full Robot'
    if (folderType === 'full_robot') {
        return 'Full Robot';
    } else if (folderType === 'drive_train') {
        return 'Drive Train';
    }
    return 'root'; // 默认返回 'root'
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


// 列出文件的函数
async function listFiles(auth) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const response = await drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, webViewLink)', // 返回所需的字段
        });
        return response.data.files;
    } catch (err) {
        console.error('The API returned an error during get the files list:', err);
        return [];
    }
}

// 删除文件的路由
app.get('/delete', async (req, res) => {
    const fileId = req.query.file_ID; // 获取文件ID
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
const fileToDelete = '要删除的文件ID'; // 替换为要删除的文件ID
deleteFile(fileToDelete);
*/

const mysql = require('mysql');
const dbConfig = require('./config/DBConfig'); // 引入数据库配置
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const connection = mysql.createConnection(dbConfig);

// 连接到数据库
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

// API端点来接收数据并存储到数据库
app.post('/submit-form', (req, res) => {
    const formData = req.body;
    // 假设你有一个名为survey_responses的表来存储表单数据
    const query = 'INSERT INTO survey_responses SET ?';

    db.query(query, formData, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
        } else {
            res.send('Data saved successfully');
        }
    });
});







const stream = require('stream');

// Google Drive 图片代理路由
app.get('/drive-image/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const driveResponse = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, { responseType: 'stream' });

        res.setHeader('Content-Type', 'image/jpeg'); // 可根据需要更改 MIME 类型
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



// 启动服务器
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
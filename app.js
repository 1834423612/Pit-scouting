const express = require('express'); // Web框架
const multer = require('multer'); // 处理文件上传
const { google } = require('googleapis'); // Google API客户端库
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // 上传文件的临时目录
const cors = require('cors');

// 使用默认的 CORS 配置
app.use(cors());

// 从下载的服务账户 JSON 文件加载凭证
const KEYFILEPATH = './loyal-polymer-411002-b8ec065f71d9.json';
const SCOPES = ['https://www.googleapis.com/auth/drive']; // 要请求的权限

// 创建一个新的JWT客户端
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

// 声明 V3 版本的 Drive API
const drive = google.drive({
    version: 'v3',
    auth,
});

// const FOLDER_ID = '文件夹ID'; // 文件夹ID
const FolderName = 'scoutify'; // 文件夹名称
const userEmails = ['admin@kjchmc.cn']; // 需要添加编辑权限的用户邮箱, 可以是多个, 用逗号分隔, 例如：['user1@xxx.com', 'user2@xxx.com'], 'akahn@beachwoodstudents.org'


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

// 查找文件夹, 不存在则创建, 并返回文件夹ID
async function findOrCreateFolder(FolderName) {
    const response = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${FolderName}'`,
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    const folders = response.data.files;
    if (folders.length > 0) {
        // 如果找到文件夹，返回第一个找到的文件夹的ID
        return folders[0].id;
    } else {
        // 如果没有找到文件夹，创建一个新的文件夹
        const fileMetadata = {
            'name': FolderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return folder.data.id;
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
async function findOrCreateFolder(folderName) {
    const response = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    let folderId;
    if (response.data.files.length > 0) {
        folderId = response.data.files[0].id;
    } else {
        const fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder' // Google Drive 文件夹的 MIME 类型
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        folderId = folder.data.id;
    }

    await setFolderPermissions(folderId); // 设置文件夹权限
    return folderId;
}

// 上传文件并设置权限
async function uploadFileAndSetPermissions(filePath, originalName, folderName) {
    try {
        const folderId = await findOrCreateFolder(folderName); // 根据传入的文件夹名查找或创建文件夹
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

    let folderName;
    switch (req.query.type) {
        case 'full_robot':
            folderName = 'Full Robot';
            break;
        case 'drive_train':
            folderName = 'Drive Train';
            break;
        default:
            folderName = 'scoutify';
    }

    try {
        const driveResponse = await uploadFileAndSetPermissions(file.path, file.originalname, folderName);
        fs.unlinkSync(file.path); // Delete the temporary storge file when upload complete
        res.send({ fileId: driveResponse.id, webViewLink: driveResponse.webViewLink });
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        res.status(500).send('Error uploading file to Google Drive');
    }
});



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
        const authClient = await auth.getClient();
        // 调用Google Drive API来删除文件
        await drive.files.delete({
            fileId: fileId
        });

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
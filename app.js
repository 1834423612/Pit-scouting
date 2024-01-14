const express = require('express'); // Web框架
const multer = require('multer'); // 处理文件上传
const { google } = require('googleapis'); // Google API客户端库
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // 上传文件的临时目录

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
const userEmails = ['admin@kjchmc.cn', 'akahn@beachwoodstudents.org']; // 需要添加编辑权限的用户邮箱, 可以是多个, 用逗号分隔, 例如：['user1@xxx.com', 'user2@xxx.com']


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
async function uploadFileAndSetPermissions(filePath, originalName) {
    try {
        const folderId = await findOrCreateFolder(FolderName); // 查找或创建“scoutify”文件夹
        const mimeType = getMimeType(filePath); // 获取文件的MIME类型

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
        console.error('上传文件出错:', error);
        throw new Error('文件上传失败');
    }
}



// 处理上传请求
app.post('/upload', upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('未上传文件');
    }

    try {
        const driveResponse = await uploadFileAndSetPermissions(file.path, file.originalname);
        fs.unlinkSync(file.path); // 删除上传的临时文件
        console.log('预览链接:', driveResponse.webViewLink); // 打印预览链接到控制台
        res.send(driveResponse);
    } catch (error) {
        res.status(500).send('上传到 Google Drive 时出错');
    }
});


// 新增路由来提供主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 列出文件的路由
app.get('/list-files', async (req, res) => {
    try {
        const files = await listFiles(auth);
        res.json(files); // 发送JSON响应至客户端
    } catch (err) {
        console.error('获取文件列表时出错:', err);
        res.status(500).send('获取文件列表失败');
    }
});


// 列出文件的路由
app.get('/list.html', async (req, res) => {
    const files = await listFiles(auth);
    // console.log(files); // 在控制台打印文件列表
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


// 启动服务器
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
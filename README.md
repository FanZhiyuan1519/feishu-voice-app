# 飞书语音识别应用部署指南

## 项目说明

这是一个飞书网页应用，用户可以通过上传语音文件或直接录音的方式，调用问学工作流API进行语音识别。

## 功能特性

- ✅ 上传语音文件（支持 MP3, WAV, M4A 等格式）
- ✅ 浏览器直接录音
- ✅ 调用问学工作流API
- ✅ 实时显示识别结果
- ✅ 美观的用户界面

## 文件结构

```
feishu-app/
├── index.html      # 主页面
├── app.js          # JavaScript逻辑
├── style.css       # 样式文件
└── README.md       # 部署说明
```

## 部署步骤

### 第一步：配置API密钥

1. 打开 `app.js` 文件
2. 找到以下配置：
   ```javascript
   const API_BASE_URL = 'http://10.0.1.25/api/v1';
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
3. 修改为你的实际配置：
   ```javascript
   const API_BASE_URL = 'http://你的问学服务地址/api/v1';
   const API_KEY = '你的API密钥';
   ```

### 第二步：部署到静态网页托管

#### 选项1：GitHub Pages（推荐，免费）

1. **创建GitHub仓库**
   ```
   1. 访问 https://github.com/new
   2. 创建新仓库，例如：feishu-voice-app
   3. 上传 feishu-app 文件夹中的所有文件
   ```

2. **启用GitHub Pages**
   ```
   1. 进入仓库设置
   2. 点击 "Pages"
   3. 在 "Source" 中选择 "Deploy from a branch"
   4. 选择 "main" 分支和 "/ (root)" 目录
   5. 点击 "Save"
   6. 等待几分钟，会生成访问地址
   ```

3. **获取访问地址**
   ```
   地址格式：https://你的用户名.github.io/仓库名/
   例如：https://username.github.io/feishu-voice-app/
   ```

#### 选项2：Vercel（推荐，免费）

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   cd feishu-app
   vercel
   ```

3. **按照提示操作**
   ```
   1. 登录或注册Vercel账号
   2. 选择项目设置
   3. 等待部署完成
   4. 获取访问地址
   ```

#### 选项3：Netlify（推荐，免费）

1. **访问Netlify**
   ```
   https://app.netlify.com/drop
   ```

2. **拖拽部署**
   ```
   1. 将 feishu-app 文件夹拖拽到页面中
   2. 等待上传完成
   3. 获取访问地址
   ```

#### 选项4：自己的服务器

1. **上传文件到服务器**
   ```bash
   scp -r feishu-app/* user@your-server:/var/www/html/
   ```

2. **配置Nginx（如果需要）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;
   }
   ```

### 第三步：在飞书开放平台创建应用

1. **创建飞书应用**
   ```
   1. 访问 https://open.feishu.cn/
   2. 登录账号
   3. 点击"创建应用"
   4. 选择"网页应用"或"H5应用"
   5. 填写应用信息：
      - 应用名称：语音识别助手
      - 应用描述：上传语音或录音，自动识别
   6. 创建应用
   ```

2. **配置网页应用**
   ```
   1. 进入应用管理
   2. 找到"网页应用"或"H5应用"配置
   3. 填写网页地址：
      - 例如：https://username.github.io/feishu-voice-app/
   4. 保存配置
   ```

3. **发布应用**
   ```
   1. 点击"发布"或"上线"
   2. 等待审核（如果需要）
   3. 发布成功
   ```

### 第四步：在飞书中使用

1. **添加应用到飞书**
   ```
   1. 在飞书客户端中
   2. 进入"工作台"
   3. 点击"添加应用"
   4. 搜索你的应用
   5. 添加到工作台
   ```

2. **使用应用**
   ```
   1. 在飞书中打开应用
   2. 选择上传语音或录音
   3. 等待识别结果
   4. 查看结果
   ```

## 配置说明

### API配置

在 `app.js` 中配置：

```javascript
const API_BASE_URL = 'http://10.0.1.25/api/v1';  // 问学API地址
const API_KEY = 'YOUR_API_KEY_HERE';           // 问学API密钥
```

### 文件上传API

如果问学的文件上传API地址不同，修改 `uploadFileToWenxue` 函数：

```javascript
async function uploadFileToWenxue(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {  // 修改这里
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        },
        body: formData
    });

    // ... 其余代码
}
```

### 工作流参数

如果工作流需要不同的参数，修改 `callWorkflow` 函数：

```javascript
async function callWorkflow(uploadFileId) {
    const response = await fetch(`${API_BASE_URL}/workflows/run`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: {
                audio_file: {  // 修改这里的参数名
                    type: 'audio',
                    transfer_method: 'local_file',
                    upload_file_id: uploadFileId
                }
            },
            response_mode: 'blocking',
            user_id: getUserId()
        })
    });

    // ... 其余代码
}
```

## 常见问题

### 1. 麦克风无法访问

**问题**：点击"开始录音"后提示无法访问麦克风

**解决方案**：
- 确保使用HTTPS或localhost
- 检查浏览器权限设置
- 确保设备有麦克风

### 2. 文件上传失败

**问题**：上传文件时提示失败

**解决方案**：
- 检查API地址是否正确
- 检查API密钥是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 3. 工作流调用失败

**问题**：调用工作流时返回错误

**解决方案**：
- 检查工作流ID是否正确
- 检查参数格式是否正确
- 查看问学平台的工作流执行日志
- 检查API密钥权限

### 4. 跨域问题

**问题**：浏览器控制台显示跨域错误

**解决方案**：
- 确保问学API支持CORS
- 或使用代理服务器
- 或在问学服务器上配置CORS头

### 5. 内网地址无法访问

**问题**：问学API地址是内网地址，无法从公网访问

**解决方案**：
- 将问学服务部署到公网
- 使用内网穿透工具（ngrok、frp）
- 使用VPN

## 测试

### 本地测试

1. **启动本地服务器**
   ```bash
   cd feishu-app
   python -m http.server 8000
   ```

2. **访问应用**
   ```
   http://localhost:8000
   ```

3. **测试功能**
   - 上传语音文件
   - 测试录音功能
   - 查看识别结果

### 在飞书中测试

1. **在飞书中打开应用**
2. **测试上传语音**
3. **测试录音功能**
4. **查看识别结果**

## 优化建议

1. **添加错误处理**
   - 更详细的错误提示
   - 重试机制

2. **添加加载动画**
   - 更好的用户体验

3. **支持更多音频格式**
   - 添加格式转换

4. **添加历史记录**
   - 保存识别历史
   - 方便查看

5. **添加导出功能**
   - 导出识别结果
   - 支持多种格式

## 技术支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. 网络请求详情
3. 问学API文档
4. 飞书开放平台文档

## 许可证

MIT License

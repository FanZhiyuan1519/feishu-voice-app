const API_BASE_URL = 'http://10.0.1.25/api/v1';
const API_KEY = 'wf-swenYf9jtY9mqxEa8K7fQb3t';
const WORKFLOW_ID = '81';
const FILE_INPUT_NAME = 'files';  // 根据问学API文档修改这里，可能是 'file', 'audio', 'files' 等

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
});

function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('audioFile');

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    if (!file.type.startsWith('audio/')) {
        alert('请选择音频文件');
        return;
    }

    selectedFile = file;
    
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('uploadArea').style.display = 'none';
}

function removeFile() {
    selectedFile = null;
    document.getElementById('audioFile').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        recordingStartTime = Date.now();

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
            
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = audioUrl;
            document.getElementById('audioPreview').style.display = 'block';

            processAudioFile(audioFile);
        };

        mediaRecorder.start();
        
        document.getElementById('btnRecord').disabled = true;
        document.getElementById('btnStop').disabled = false;
        document.getElementById('recordingStatus').style.display = 'flex';
        
        recordingTimer = setInterval(updateRecordingTime, 1000);
        
    } catch (error) {
        alert('无法访问麦克风：' + error.message);
        console.error('录音错误:', error);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        clearInterval(recordingTimer);
        
        document.getElementById('btnRecord').disabled = false;
        document.getElementById('btnStop').disabled = true;
        document.getElementById('recordingStatus').style.display = 'none';
        document.getElementById('recordingTime').textContent = '00:00';
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('recordingTime').textContent = `${minutes}:${seconds}`;
}

async function processUploadedFile() {
    if (!selectedFile) {
        alert('请先选择音频文件');
        return;
    }
    
    await processAudioFile(selectedFile);
}

async function processAudioFile(file) {
    showLoading();
    
    try {
        const fileUrl = await uploadFileToTempService(file);
        const fileType = getFileType(file);
        const result = await callWorkflow(fileUrl, fileType);
        
        showResult(result);
    } catch (error) {
        showError(error.message);
        console.error('处理失败:', error);
    }
}

function getFileType(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const typeMap = {
        'mp3': 'MP3',
        'm4a': 'M4A',
        'wav': 'WAV',
        'webm': 'WEBM',
        'amr': 'AMR',
        'mp4': 'MP4',
        'mov': 'MOV',
        'mpeg': 'MPEG',
        'mpga': 'MPGA'
    };
    return typeMap[ext] || 'MP3';
}

async function uploadFileToTempService(file) {
    const formData = new FormData();
    formData.append('files', file);

    console.log('开始上传文件:', file.name, file.size, file.type);

    const response = await fetch(`${API_BASE_URL}/file/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        },
        body: formData
    });

    console.log('上传响应状态:', response.status, response.statusText);

    const result = await response.json();
    console.log('上传返回结果:', JSON.stringify(result, null, 2));
    
    if (Array.isArray(result) && result.length > 0) {
        console.log('返回数组格式，使用第一个元素的id:', result[0].id);
        return result[0].id;
    } else if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        console.log('返回对象包含data数组，使用第一个元素的id:', result.data[0].id);
        return result.data[0].id;
    } else if (result && result.id) {
        console.log('返回对象格式，使用id:', result.id);
        return result.id;
    } else if (result && result.upload_file_id) {
        console.log('返回对象格式，使用upload_file_id:', result.upload_file_id);
        return result.upload_file_id;
    }
    
    console.log('未知的返回格式，直接返回整个result');
    return result;
}

async function callWorkflow(uploadFileId, fileType) {
    console.log('开始调用工作流，文件ID:', uploadFileId, '文件类型:', fileType);

    const requestBody = {
        inputs: {
            files: {
                type: fileType,
                transfer_method: 'local_file',
                upload_file_id: uploadFileId
            }
        },
        response_mode: 'blocking',
        user_id: getUserId()
    };

    console.log('工作流请求体:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/workflows/run`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    console.log('工作流响应状态:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('工作流原始响应:', responseText);

    if (!response.ok) {
        console.error('工作流调用失败:', responseText);
        throw new Error(`工作流调用失败: ${responseText}`);
    }

    let result;
    try {
        result = JSON.parse(responseText);
        console.log('工作流解析后的结果:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('JSON解析失败:', error);
        console.error('原始响应内容:', responseText);
        throw new Error(`工作流返回格式错误: ${responseText}`);
    }

    return result;
}

function getUserId() {
    let userId = localStorage.getItem('feishu_user_id');
    if (!userId) {
        userId = 'user_' + Date.now();
        localStorage.setItem('feishu_user_id', userId);
    }
    return userId;
}

function showLoading() {
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultText').style.display = 'none';
    document.getElementById('resultError').style.display = 'none';
}

function showResult(result) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('resultText').style.display = 'block';
    document.getElementById('resultError').style.display = 'none';
    
    const resultJson = document.getElementById('resultJson');
    resultJson.textContent = JSON.stringify(result, null, 2);
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('resultText').style.display = 'none';
    document.getElementById('resultError').style.display = 'block';
    
    document.getElementById('errorMessage').textContent = message;
}

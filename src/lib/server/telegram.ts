export async function uploadFileToTelegram(botToken: string, chatId: string, file: File | Blob, filename: string) {
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', file, filename);

    // 60 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); 
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const data = await res.json();
        
        if (!data.ok) {
            throw new Error(data.description || 'Failed to upload to Telegram');
        }
        
        // Telegram might return document, audio, or video based on how it interprets the file,
        // but since we explicitly use sendDocument, it should usually be under 'document'.
        // However, we can fallback to check other types just in case.
        const fileObj = data.result.document || data.result.audio || data.result.video;
        
        if (!fileObj) {
           throw new Error('Telegram response did not contain a valid file object.');
        }

        return {
            telegramFileId: fileObj.file_id,
            telegramFileName: fileObj.file_name || filename,
            telegramMimeType: fileObj.mime_type,
            telegramFileSize: fileObj.file_size
        };
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Telegram API request timed out');
        }
        throw err;
    }
}

export async function getFileDownloadUrl(botToken: string, fileId: string) {
    const url = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.ok) {
        throw new Error(data.description || 'Failed to get file from Telegram');
    }
    
    const filePath = data.result.file_path;
    return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
}

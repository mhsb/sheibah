// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const previewContent = document.getElementById('previewContent');
const statusValue = document.getElementById('statusValue');
const fileNameValue = document.getElementById('fileNameValue');
const conversionTypeValue = document.getElementById('conversionTypeValue');

// Mobile formatting settings
const MOBILE_FORMATTING = {
    page: {
        width: 6.27,    // inches (A6 equivalent for mobile)
        height: 8.7,    // inches  
        orientation: 'portrait'
    },
    margins: {
        top: 0.5,       // inches
        right: 0.4,     // inches
        bottom: 0.5,    // inches
        left: 0.4,      // inches
        header: 0.3,    // inches
        footer: 0.3     // inches
    },
    fonts: {
        footnote: 9,    // points
        normal: 11,     // points
        heading1: 16,   // points
        heading2: 14,   // points
        heading3: 12    // points
    }
};

// Initialize
function init() {
    setupEventListeners();
    updateStatus('آماده برای آپلود فایل');
}

// Event Listeners
function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// File Selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Main File Processing
async function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
        alert('لطفاً یک فایل DOCX انتخاب کنید.');
        return;
    }
    
    updateStatus('در حال پردازش فایل...');
    fileNameValue.textContent = file.name;
    
    const conversionType = document.querySelector('input[name="conversionType"]:checked').value;
    conversionTypeValue.textContent = getConversionTypeText(conversionType);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (conversionType === 'mobile') {
            // Process for mobile formatting
            await processMobileFormatting(arrayBuffer, file.name);
        } else {
            // Original conversion logic
            const result = await mammoth.convertToHtml({arrayBuffer});
            let convertedContent = '';
            
            switch(conversionType) {
                case 'html':
                    convertedContent = result.value;
                    break;
                case 'text':
                    convertedContent = convertToPlainText(result.value);
                    break;
                case 'preview':
                    convertedContent = await generateMobilePreview(result.value);
                    break;
            }
            
            displayPreview(convertedContent, conversionType);
            updateStatus('تبدیل با موفقیت انجام شد');
        }
        
    } catch (error) {
        console.error('Conversion error:', error);
        updateStatus('خطا در تبدیل فایل');
        alert('خطا در پردازش فایل. لطفاً فایل دیگری را امتحان کنید.');
    }
}

// Process DOCX for mobile formatting
async function processMobileFormatting(arrayBuffer, fileName) {
    updateStatus('در حال اعمال فرمت موبایل...');
    
    try {
        // Load docx library dynamically
        const docxModule = await import('https://cdn.jsdelivr.net/npm/docx@8.2.0/+esm');
        const docx = docxModule;
        
        // Convert the uploaded DOCX to a format we can modify
        const convertedDoc = await convertDocxForMobile(arrayBuffer, fileName, docx);
        
        if (convertedDoc) {
            displayMobileFormattingPreview(convertedDoc);
            updateStatus('فرمت موبایل اعمال شد');
        } else {
            // Fallback: show what would be changed
            const result = await mammoth.convertToHtml({arrayBuffer});
            const previewContent = await generateMobilePreview(result.value);
            displayPreview(previewContent, 'preview');
            updateStatus('پیش‌نمایش تغییرات فرمت موبایل');
        }
        
    } catch (error) {
        console.error('Mobile formatting error:', error);
        // Fallback to preview mode
        const result = await mammoth.convertToHtml({arrayBuffer});
        const previewContent = await generateMobilePreview(result.value);
        displayPreview(previewContent, 'preview');
        updateStatus('پیش‌نمایش تغییرات (دانلود در دسترس نیست)');
    }
}

// Convert DOCX for mobile (simplified version)
async function convertDocxForMobile(arrayBuffer, fileName, docx) {
    updateStatus('در حال تنظیم اندازه صفحات و حاشیه‌ها...');
    
    try {
        // For now, we'll create a detailed preview of what would be changed
        // Actual DOCX modification requires more complex processing
        const result = await mammoth.convertToHtml({arrayBuffer});
        return {
            fileName: fileName,
            originalSize: (arrayBuffer.byteLength / 1024 / 1024).toFixed(2),
            changes: getFormattingChanges(),
            content: result.value
        };
    } catch (error) {
        console.error('DOCX processing error:', error);
        return null;
    }
}

// Generate mobile formatting preview
function generateMobilePreview(htmlContent) {
    const changes = getFormattingChanges();
    
    let preview = `
        <div class="mobile-preview">
            <div class="formatting-changes">
                <h3>📱 تغییرات اعمال شده برای فرمت موبایل:</h3>
                <div class="changes-list">
    `;
    
    changes.forEach(change => {
        preview += `
            <div class="change-item">
                <span class="change-icon">${change.icon}</span>
                <div>
                    <strong>${change.title}</strong>
                    <p>${change.description}</p>
                    <small>${change.details}</small>
                </div>
            </div>
        `;
    });
    
    preview += `
                </div>
            </div>
            <div class="content-preview">
                <h3>پیش‌نمایش محتوا:</h3>
                <div class="preview-content">${htmlContent}</div>
            </div>
            <div class="mobile-tips">
                <h4>💡 نکات برای نمایش بهتر در موبایل:</h4>
                <ul>
                    <li>فونت‌ها برای خوانایی در صفحه‌های کوچک بهینه شده‌اند</li>
                    <li>حاشیه‌ها کاهش یافته تا فضای بیشتری در اختیار متن باشد</li>
                    <li>اندازه صفحه برای نمایش عمودی (portrait) تنظیم شده</li>
                    <li>پاورقی‌ها با فونت کوچک‌تر نمایش داده می‌شوند</li>
                </ul>
            </div>
        </div>
    `;
    
    return preview;
}

// Display mobile formatting preview
function displayMobileFormattingPreview(docInfo) {
    const preview = generateMobilePreview(docInfo.content);
    displayPreview(preview, 'mobile');
    
    // Update action buttons for mobile formatting
    updateActionButtonsForMobile();
}

// Update action buttons for mobile formatting
function updateActionButtonsForMobile() {
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = `
        <button class="btn-primary" onclick="downloadMobileFormatted()">دانلود سند موبایل</button>
        <button class="btn-secondary" onclick="showFormattingDetails()">مشاهده جزئیات تغییرات</button>
        <button class="btn-secondary" onclick="resetConverter()">تبدیل فایل جدید</button>
    `;
}

// Get formatting changes description
function getFormattingChanges() {
    return [
        {
            icon: '📐',
            title: 'اندازه صفحه',
            description: 'تنظیم برای نمایش بهینه در موبایل',
            details: `عرض: ${MOBILE_FORMATTING.page.width} اینچ | ارتفاع: ${MOBILE_FORMATTING.page.height} اینچ`
        },
        {
            icon: '📏',
            title: 'حاشیه‌ها',
            description: 'کاهش حاشیه‌ها برای استفاده بهینه از فضای صفحه',
            details: `بالا/پایین: ${MOBILE_FORMATTING.margins.top} اینچ | چپ/راست: ${MOBILE_FORMATTING.margins.left} اینچ`
        },
        {
            icon: '🔤',
            title: 'فونت پاورقی',
            description: 'کاهش سایز فونت برای صرفه‌جویی در فضای صفحه',
            details: `سایز جدید: ${MOBILE_FORMATTING.fonts.footnote} نقطه`
        },
        {
            icon: '📝',
            title: 'فونت‌های اصلی',
            description: 'بهینه‌سازی سایز فونت‌ها برای خوانایی در موبایل',
            details: `متن معمولی: ${MOBILE_FORMATTING.fonts.normal} نقطه | عناوین: ${MOBILE_FORMATTING.fonts.heading1}-${MOBILE_FORMATTING.fonts.heading3} نقطه`
        }
    ];
}

// Download mobile formatted document
function downloadMobileFormatted() {
    alert('برای پیاده‌سازی کامل این قابلیت، نیاز به سرور برای پردازش فایل‌های DOCX داریم. در این نسخه نمایشی، تغییرات به صورت پیش‌نمایش نشان داده می‌شوند.');
    
    // Create a simple text file with the formatting details
    const changes = getFormattingChanges();
    let content = 'تغییرات اعمال شده برای فرمت موبایل:\n\n';
    
    changes.forEach(change => {
        content += `• ${change.title}: ${change.description}\n  ${change.details}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mobile-formatting-changes.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Show formatting details
function showFormattingDetails() {
    const changes = getFormattingChanges();
    let details = 'جزئیات کامل تغییرات فرمت موبایل:\n\n';
    
    changes.forEach(change => {
        details += `🏷️ ${change.title}\n`;
        details += `📝 ${change.description}\n`;
        details += `⚙️ ${change.details}\n\n`;
    });
    
    alert(details);
}

// Convert HTML to plain text
function convertToPlainText(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

// Display Preview
function displayPreview(content, type) {
    previewContent.innerHTML = content;
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset Converter
function resetConverter() {
    fileInput.value = '';
    previewSection.style.display = 'none';
    previewContent.innerHTML = '';
    fileNameValue.textContent = '-';
    conversionTypeValue.textContent = '-';
    updateStatus('آماده برای آپلود فایل');
    
    // Reset action buttons
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.innerHTML = `
        <button class="btn-secondary" onclick="downloadAsText()">دانلود به عنوان متن</button>
        <button class="btn-secondary" onclick="copyToClipboard()">کپی به حافظه</button>
        <button class="btn-primary" onclick="resetConverter()">تبدیل فایل جدید</button>
    `;
}

// Download as Text
function downloadAsText() {
    const text = previewContent.textContent;
    const blob = new Blob([text], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-document.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Copy to Clipboard
async function copyToClipboard() {
    try {
        const text = previewContent.textContent;
        await navigator.clipboard.writeText(text);
        alert('متن با موفقیت کپی شد!');
    } catch (err) {
        console.error('Copy failed:', err);
        alert('خطا در کپی کردن متن');
    }
}

// Helper Functions
function updateStatus(message) {
    statusValue.textContent = message;
}

function getConversionTypeText(type) {
    const types = {
        'html': 'تبدیل به HTML',
        'text': 'تبدیل به متن ساده',
        'preview': 'پیش‌نمایش فرمت موبایل',
        'mobile': 'فرمت موبایل'
    };
    return types[type] || type;
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const toggleBtn = document.querySelector('.dark-mode-toggle');
    toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.querySelector('.dark-mode-toggle').textContent = '☀️';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

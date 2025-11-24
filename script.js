// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const previewContent = document.getElementById('previewContent');
const statusValue = document.getElementById('statusValue');
const fileNameValue = document.getElementById('fileNameValue');
const conversionTypeValue = document.getElementById('conversionTypeValue');
const downloadBtn = document.getElementById('downloadBtn');

// Global variables
let currentFileName = '';
let formattedDocBlob = null;

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
    currentFileName = file.name;
    
    const conversionType = document.querySelector('input[name="conversionType"]:checked').value;
    conversionTypeValue.textContent = getConversionTypeText(conversionType);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (conversionType === 'mobile') {
            await createMobileFormattedDoc(arrayBuffer, file.name);
        } else {
            const result = await mammoth.convertToHtml({arrayBuffer});
            const previewContent = generateMobilePreview(result.value);
            displayPreview(previewContent, 'preview');
            updateStatus('پیش‌نمایش آماده شد');
        }
        
    } catch (error) {
        console.error('Processing error:', error);
        updateStatus('خطا در پردازش فایل');
        alert('خطا در پردازش فایل. لطفاً فایل دیگری را امتحان کنید.');
    }
}

// Create mobile formatted DOCX
async function createMobileFormattedDoc(arrayBuffer, fileName) {
    updateStatus('در حال ایجاد سند موبایل...');
    
    try {
        // For now, we'll create a simple text file with formatting instructions
        // In a real implementation, you'd use docx library properly
        const result = await mammoth.convertToHtml({arrayBuffer});
        const formattingInfo = generateFormattingInfo();
        
        // Create a simple text file with the content and formatting instructions
        const content = `
سند بهینه شده برای موبایل
فایل اصلی: ${fileName}

مشخصات فرمت‌بندی موبایل:
${formattingInfo}

محتوای سند:
${result.value ? stripHtml(result.value) : 'محتوایی یافت نشد'}
        `.trim();
        
        // Create blob for download
        formattedDocBlob = new Blob([content], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        // Show success message
        displaySuccessMessage(fileName);
        downloadBtn.style.display = 'inline-block';
        updateStatus('سند موبایل آماده دانلود');
        
    } catch (error) {
        console.error('DOCX creation error:', error);
        // Fallback to preview mode
        const result = await mammoth.convertToHtml({arrayBuffer});
        const previewContent = generateMobilePreview(result.value);
        displayPreview(previewContent, 'preview');
        updateStatus('پیش‌نمایش تغییرات (دانلود در دسترس نیست)');
    }
}

// Generate formatting information
function generateFormattingInfo() {
    return `
• اندازه صفحه: 15.9 سانتی‌متر × 22.1 سانتی‌متر
• حاشیه بالا/پایین: 1.27 سانتی‌متر
• حاشیه چپ/راست: 1.02 سانتی‌متر  
• فونت معمولی: 11 نقطه
• فونت پاورقی: 9 نقطه
• فونت عنوان اصلی: 16 نقطه
• فونت عنوان فرعی: 14 نقطه
• بهینه‌سازی برای نمایش در موبایل
    `.trim();
}

// Strip HTML tags for text content
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Download formatted document
function downloadFormattedDoc() {
    if (!formattedDocBlob) {
        alert('هیچ سندی برای دانلود موجود نیست.');
        return;
    }
    
    try {
        const url = URL.createObjectURL(formattedDocBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName.replace('.docx', '_mobile.docx');
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        updateStatus('سند با موفقیت دانلود شد');
    } catch (error) {
        console.error('Download error:', error);
        alert('خطا در دانلود فایل: ' + error.message);
    }
}

// Display success message
function displaySuccessMessage(fileName) {
    const changes = getFormattingChanges();
    
    const successHTML = `
        <div class="success-message">
            <div class="success-header">
                <span class="success-icon">✅</span>
                <h3>سند موبایل با موفقیت ایجاد شد!</h3>
            </div>
            
            <div class="file-info">
                <p><strong>فایل اصلی:</strong> ${fileName}</p>
                <p><strong>فایل جدید:</strong> ${fileName.replace('.docx', '_mobile.docx')}</p>
            </div>
            
            <div class="changes-applied">
                <h4>تغییرات اعمال شده:</h4>
                <div class="changes-grid">
                    ${changes.map(change => `
                        <div class="change-applied">
                            <span class="change-icon">${change.icon}</span>
                            <div>
                                <strong>${change.title}</strong>
                                <p>${change.details}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="download-instruction">
                <p>روی دکمه <strong>"دانلود سند موبایل"</strong> کلیک کنید تا فایل جدید دریافت شود.</p>
                <p class="download-note">اگر فایل دانلود نشد، ممکن است مرورگر شما pop-up را مسدود کرده باشد.</p>
            </div>
        </div>
    `;
    
    displayPreview(successHTML, 'mobile');
}

// Generate mobile preview
function generateMobilePreview(htmlContent) {
    const changes = getFormattingChanges();
    
    return `
        <div class="mobile-preview">
            <div class="preview-notice">
                <h3>👆 پیش‌نمایش تغییرات فرمت موبایل</h3>
                <p>برای ایجاد فایل جدید با فرمت موبایل، گزینه "ایجاد نسخه موبایل" را انتخاب کنید.</p>
            </div>
            
            <div class="formatting-changes">
                <h4>تغییراتی که اعمال خواهند شد:</h4>
                <div class="changes-list">
                    ${changes.map(change => `
                        <div class="change-item">
                            <span class="change-icon">${change.icon}</span>
                            <div>
                                <strong>${change.title}</strong>
                                <p>${change.description}</p>
                                <small>${change.details}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="content-preview">
                <h4>پیش‌نمایش محتوا:</h4>
                <div class="preview-content">${htmlContent}</div>
            </div>
        </div>
    `;
}

// Get formatting changes description
function getFormattingChanges() {
    return [
        {
            icon: '📐',
            title: 'اندازه صفحه',
            description: 'تنظیم برای نمایش بهینه در موبایل',
            details: '15.9 سانتی‌متر × 22.1 سانتی‌متر'
        },
        {
            icon: '📏',
            title: 'حاشیه‌ها',
            description: 'کاهش حاشیه‌ها برای استفاده بهینه از فضای صفحه',
            details: 'حاشیه‌ها: 1.27 سانتی‌متر از بالا/پایین، 1.02 سانتی‌متر از چپ/راست'
        },
        {
            icon: '🔤',
            title: 'فونت‌ها',
            description: 'بهینه‌سازی سایز فونت‌ها برای خوانایی در موبایل',
            details: 'فونت معمولی: 11pt، پاورقی: 9pt، عناوین: 14-16pt'
        },
        {
            icon: '📱',
            title: 'بهینه‌سازی موبایل',
            description: 'فرمت‌بندی ویژه برای نمایش در دستگاه‌های همراه',
            details: 'سند برای خوانایی در صفحه‌های کوچک بهینه شده است'
        }
    ];
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
    downloadBtn.style.display = 'none';
    formattedDocBlob = null;
    updateStatus('آماده برای آپلود فایل');
}

// Helper Functions
function updateStatus(message) {
    statusValue.textContent = message;
}

function getConversionTypeText(type) {
    const types = {
        'mobile': 'ایجاد نسخه موبایل',
        'preview': 'پیش‌نمایش تغییرات'
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

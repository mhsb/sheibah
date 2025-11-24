// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const previewContent = document.getElementById('previewContent');
const statusValue = document.getElementById('statusValue');
const fileNameValue = document.getElementById('fileNameValue');
const conversionTypeValue = document.getElementById('conversionTypeValue');
const downloadBtn = document.getElementById('downloadBtn');

// Global variables to store processed data
let currentFileBuffer = null;
let currentFileName = '';
let formattedDocBuffer = null;

// Mobile formatting settings (in TWIPS - 1 inch = 1440 TWIPS)
const MOBILE_FORMATTING = {
    page: {
        width: 9033,    // 6.27 inches in TWIPS
        height: 12528,  // 8.7 inches in TWIPS
        widthCm: "15.9 cm",
        heightCm: "22.1 cm"
    },
    margins: {
        top: 720,       // 0.5 inches
        right: 576,     // 0.4 inches
        bottom: 720,
        left: 576,
        topCm: "1.27 cm",
        rightCm: "1.02 cm"
    },
    fonts: {
        normal: 22,     // 11pt in half-points
        footnote: 18,   // 9pt in half-points
        heading1: 32,   // 16pt
        heading2: 28,   // 14pt
        heading3: 24    // 12pt
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
    currentFileName = file.name;
    
    const conversionType = document.querySelector('input[name="conversionType"]:checked').value;
    conversionTypeValue.textContent = getConversionTypeText(conversionType);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        currentFileBuffer = arrayBuffer;
        
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
        // For this demo, we'll create a simple formatted document
        // In a real implementation, you'd parse the original DOCX and rebuild it
        const doc = await generateFormattedDocument(arrayBuffer);
        
        // Convert to blob for download
        const blob = await docx.Packer.toBlob(doc);
        formattedDocBuffer = blob;
        
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

// Generate formatted document
async function generateFormattedDocument(arrayBuffer) {
    // Parse the original document to extract content
    const result = await mammoth.convertToHtml({arrayBuffer});
    const htmlContent = result.value;
    
    // Create a new document with mobile formatting
    const doc = new docx.Document({
        sections: [{
            properties: {
                page: {
                    width: MOBILE_FORMATTING.page.width,
                    height: MOBILE_FORMATTING.page.height,
                },
                margin: {
                    top: MOBILE_FORMATTING.margins.top,
                    right: MOBILE_FORMATTING.margins.right,
                    bottom: MOBILE_FORMATTING.margins.bottom,
                    left: MOBILE_FORMATTING.margins.left,
                }
            },
            children: await convertHtmlToDocxElements(htmlContent)
        }]
    });
    
    return doc;
}

// Convert HTML content to docx elements
async function convertHtmlToDocxElements(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elements = [];
    
    // Process each node
    for (let node of tempDiv.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = await convertElementToDocx(node);
            if (element) {
                elements.push(element);
            }
        }
    }
    
    return elements;
}

// Convert HTML element to docx element
async function convertElementToDocx(element) {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent.trim();
    
    if (!text) return null;
    
    let fontSize = MOBILE_FORMATTING.fonts.normal;
    
    // Adjust font size based on heading
    if (tagName === 'h1') fontSize = MOBILE_FORMATTING.fonts.heading1;
    else if (tagName === 'h2') fontSize = MOBILE_FORMATTING.fonts.heading2;
    else if (tagName === 'h3') fontSize = MOBILE_FORMATTING.fonts.heading3;
    
    return new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: text,
                size: fontSize,
            })
        ]
    });
}

// Download formatted document
async function downloadFormattedDoc() {
    if (!formattedDocBuffer) {
        alert('هیچ سندی برای دانلود موجود نیست.');
        return;
    }
    
    try {
        const url = URL.createObjectURL(formattedDocBuffer);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName.replace('.docx', '_mobile.docx');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus('سند با موفقیت دانلود شد');
    } catch (error) {
        console.error('Download error:', error);
        alert('خطا در دانلود فایل.');
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
                <p>روی دکمه "دانلود سند موبایل" کلیک کنید تا فایل جدید دریافت شود.</p>
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
            details: `${MOBILE_FORMATTING.page.widthCm} × ${MOBILE_FORMATTING.page.heightCm}`
        },
        {
            icon: '📏',
            title: 'حاشیه‌ها',
            description: 'کاهش حاشیه‌ها برای استفاده بهینه از فضای صفحه',
            details: `حاشیه‌ها: ${MOBILE_FORMATTING.margins.topCm} از بالا/پایین، ${MOBILE_FORMATTING.margins.rightCm} از چپ/راست`
        },
        {
            icon: '🔤',
            title: 'فونت‌ها',
            description: 'بهینه‌سازی سایز فونت‌ها برای خوانایی در موبایل',
            details: 'فونت‌های عناوین و متن اصلی برای موبایل بهینه شده‌اند'
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
    currentFileBuffer = null;
    formattedDocBuffer = null;
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

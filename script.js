// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const previewContent = document.getElementById('previewContent');
const statusValue = document.getElementById('statusValue');
const fileNameValue = document.getElementById('fileNameValue');
const conversionTypeValue = document.getElementById('conversionTypeValue');

// Initialize
function init() {
    setupEventListeners();
    updateStatus('آماده برای آپلود فایل');
}

// Event Listeners
function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Click on upload area
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
        const result = await mammoth.convertToHtml({arrayBuffer});
        
        let convertedContent = '';
        
        switch(conversionType) {
            case 'html':
                convertedContent = result.value;
                break;
            case 'text':
                convertedContent = convertToPlainText(result.value);
                break;
            case 'summary':
                convertedContent = await generateSummary(result.value);
                break;
        }
        
        displayPreview(convertedContent, conversionType);
        updateStatus('تبدیل با موفقیت انجام شد');
        
    } catch (error) {
        console.error('Conversion error:', error);
        updateStatus('خطا در تبدیل فایل');
        alert('خطا در پردازش فایل. لطفاً فایل دیگری را امتحان کنید.');
    }
}

// Convert HTML to plain text
function convertToPlainText(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}

// Generate summary (simplified version)
async function generateSummary(content) {
    updateStatus('در حال تولید خلاصه...');
    
    // Simple summary by extracting first few paragraphs and important headings
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3');
    const paragraphs = tempDiv.querySelectorAll('p');
    
    let summary = '<h3>خلاصه سند:</h3>';
    
    // Add main headings
    if (headings.length > 0) {
        summary += '<h4>عنوان‌های اصلی:</h4><ul>';
        headings.forEach(heading => {
            if (heading.textContent.trim()) {
                summary += `<li>${heading.textContent}</li>`;
            }
        });
        summary += '</ul>';
    }
    
    // Add first few meaningful paragraphs
    if (paragraphs.length > 0) {
        summary += '<h4>مطالب کلیدی:</h4>';
        let addedCount = 0;
        for (let p of paragraphs) {
            const text = p.textContent.trim();
            if (text.length > 50 && addedCount < 3) {
                summary += `<p>${text.substring(0, 200)}...</p>`;
                addedCount++;
            }
        }
    }
    
    return summary || '<p>خلاصه‌ای برای این سند تولید نشد.</p>';
}

// Display Preview
function displayPreview(content, type) {
    previewContent.innerHTML = content;
    previewSection.style.display = 'block';
    
    // Scroll to preview
    previewSection.scrollIntoView({ behavior: 'smooth' });
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

// Reset Converter
function resetConverter() {
    fileInput.value = '';
    previewSection.style.display = 'none';
    previewContent.innerHTML = '';
    fileNameValue.textContent = '-';
    conversionTypeValue.textContent = '-';
    updateStatus('آماده برای آپلود فایل');
}

// Helper Functions
function updateStatus(message) {
    statusValue.textContent = message;
}

function getConversionTypeText(type) {
    const types = {
        'html': 'تبدیل به HTML',
        'text': 'تبدیل به متن ساده',
        'summary': 'خلاصه‌سازی هوشمند'
    };
    return types[type] || type;
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const toggleBtn = document.querySelector('.dark-mode-toggle');
    toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.querySelector('.dark-mode-toggle').textContent = '☀️';
}

// Save dark mode preference
document.querySelector('.dark-mode-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

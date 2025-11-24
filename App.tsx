import React, { useState, useRef, useEffect } from 'react';
import { ProcessingStatus } from './types';
import { optimizePersianText } from './services/geminiService';
import StatusCard from './components/StatusCard';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [optimizedText, setOptimizedText] = useState<string>('');
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (status === ProcessingStatus.COMPLETED && docxBlob) {
      const timer = setTimeout(() => {
         downloadDocx();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, docxBlob]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert("لطفا فقط فایل Word با فرمت .docx وارد کنید.");
      return;
    }

    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setStatus(ProcessingStatus.READING);
    setOptimizedText('');
    setDocxBlob(null);
    setErrorMessage('');

    try {
      // Load libraries dynamically
      let mammoth;
      try {
        const mammothModule = await import('mammoth');
        mammoth = mammothModule.default || mammothModule;
      } catch (e) {
        throw new Error("خطا در بارگذاری کتابخانه Mammoth. لطفا صفحه را رفرش کنید.");
      }

      let docGeneratorModule;
      try {
        docGeneratorModule = await import('./services/docGenerator');
      } catch (e) {
         console.error(e);
         throw new Error("خطا در بارگذاری ماژول ساخت سند.");
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      // 1. Extract Text
      if (!mammoth || !mammoth.extractRawText) {
         throw new Error("ابزار خواندن فایل آماده نیست.");
      }

      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value;

      if (!rawText || !rawText.trim()) {
        throw new Error("فایل خالی است یا متن قابل استخراجی یافت نشد.");
      }

      // 2. Optimize
      setStatus(ProcessingStatus.OPTIMIZING);
      const cleanText = await optimizePersianText(rawText);
      setOptimizedText(cleanText);

      // 3. Generate DOCX
      setStatus(ProcessingStatus.GENERATING);
      const blob = await docGeneratorModule.generateMobileDocx(cleanText);
      setDocxBlob(blob);

      setStatus(ProcessingStatus.COMPLETED);

    } catch (error) {
      console.error("Processing Error:", error);
      setStatus(ProcessingStatus.ERROR);
      setErrorMessage(error instanceof Error ? error.message : "خطای ناشناخته رخ داد");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const downloadDocx = () => {
    if (!docxBlob) return;
    const url = window.URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_mobile.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200" dir="rtl">
      
      <div className="absolute top-6 left-6 no-print">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-yellow-300 shadow-md hover:shadow-lg transition-all focus:outline-none"
          title={isDarkMode ? "روشن" : "تاریک"}
        >
          {isDarkMode ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-3xl mx-auto no-print">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 transition-colors">
            مبدل فایل Word به موبایل
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors">
            بهینه‌سازی خودکار متن و حاشیه‌ها برای مطالعه آسان
          </p>
          <div className="mt-2 flex justify-center items-center gap-2">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
               ویندوز ۷ سازگار
             </span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
               Gemini AI
             </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
          <div className="p-8">
            {status === ProcessingStatus.IDLE || status === ProcessingStatus.COMPLETED || status === ProcessingStatus.ERROR ? (
                <div 
                  className={`flex justify-center items-center w-full transition-all duration-200`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                <label 
                  htmlFor="dropzone-file" 
                  className={`flex flex-col justify-center items-center w-full h-64 rounded-lg border-2 border-dashed cursor-pointer transition-all
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' 
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                >
                    <div className="flex flex-col justify-center items-center pt-5 pb-6">
                    <svg className={`mb-3 w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-bold text-blue-600 dark:text-blue-400">برای انتخاب فایل کلیک کنید</span>
                      {' '}یا فایل را اینجا رها کنید
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">فرمت DOCX (فقط Word)</p>
                    </div>
                    <input 
                    id="dropzone-file" 
                    type="file" 
                    accept=".docx"
                    className="hidden" 
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    />
                </label>
                </div>
            ) : null}

            <StatusCard status={status} message={errorMessage} />

            {status === ProcessingStatus.COMPLETED && (
              <div className="mt-8 animate-fade-in">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mb-6 text-green-800 dark:text-green-300 text-sm text-center border border-green-200 dark:border-green-800">
                  فایل موبایل به صورت خودکار دانلود شد.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={downloadDocx}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    دانلود مجدد Word
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all"
                  >
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    ذخیره PDF / چاپ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-xs">
            <p>این نرم‌افزار متن شما را استخراج کرده و با فرمت استاندارد موبایل بازسازی می‌کند.</p>
        </div>
      </div>

      {/* Print Preview Area */}
      {status === ProcessingStatus.COMPLETED && (
        <div className="hidden print:block print-container bg-white w-full h-full p-0 m-0">
           <div className="max-w-[4.5in] mx-auto p-4 text-justify bg-white" style={{ width: '4.5in', margin: '0 auto' }}>
             {optimizedText.split('\n').map((para, idx) => (
               <p key={idx} className="mb-4 text-lg leading-relaxed text-black font-['Vazirmatn']" style={{ fontSize: '14pt', lineHeight: '1.6', textAlign: 'justify' }}>
                 {para}
               </p>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;

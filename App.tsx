import React, { useState, useRef, useEffect } from 'react';
import { ProcessingStatus } from './types';
import { optimizePersianText } from './services/geminiService';
import StatusCard from './components/StatusCard';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [optimizedText, setOptimizedText] = useState<string>('');
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-download when generating is complete
  useEffect(() => {
    if (status === ProcessingStatus.COMPLETED && docxBlob) {
      const timer = setTimeout(() => {
         downloadDocx();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, docxBlob]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setStatus(ProcessingStatus.READING);
    setOptimizedText('');
    setDocxBlob(null);

    try {
      // DYNAMIC IMPORT: Load libraries only when needed to prevent startup crashes
      // if they fail to resolve immediately.
      const mammothModule = await import('mammoth');
      // Handle both ESM default export and CommonJS export styles
      const mammoth = (mammothModule as any).default || mammothModule;

      const docGeneratorModule = await import('./services/docGenerator');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // 1. Extract Text using Mammoth
      if (!mammoth || !mammoth.extractRawText) {
         throw new Error("کتابخانه پردازش فایل لود نشد. لطفا اتصال اینترنت خود را بررسی کنید.");
      }

      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value;

      if (!rawText.trim()) {
        throw new Error("فایل خالی است یا قابل خواندن نیست.");
      }

      // 2. Optimize with Gemini
      setStatus(ProcessingStatus.OPTIMIZING);
      const cleanText = await optimizePersianText(rawText);
      setOptimizedText(cleanText);

      // 3. Generate DOCX
      setStatus(ProcessingStatus.GENERATING);
      const blob = await docGeneratorModule.generateMobileDocx(cleanText);
      setDocxBlob(blob);

      setStatus(ProcessingStatus.COMPLETED);

    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto no-print">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            مبدل فایل Word به موبایل
          </h1>
          <p className="text-lg text-gray-600">
            بهینه‌سازی خودکار متن و حاشیه‌ها برای مطالعه آسان
          </p>
          <div className="mt-2 flex justify-center items-center gap-2">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
               ویندوز ۷ سازگار
             </span>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
               Gemini AI
             </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {status === ProcessingStatus.IDLE || status === ProcessingStatus.COMPLETED || status === ProcessingStatus.ERROR ? (
                <div className="flex justify-center items-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all">
                    <div className="flex flex-col justify-center items-center pt-5 pb-6">
                    <svg className="mb-3 w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-bold text-blue-600">برای انتخاب فایل کلیک کنید</span></p>
                    <p className="text-xs text-gray-500">فرمت DOCX (فقط Word)</p>
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

            <StatusCard status={status} />

            {status === ProcessingStatus.COMPLETED && (
              <div className="mt-8 animate-fade-in">
                <div className="bg-green-50 p-4 rounded-lg mb-6 text-green-800 text-sm text-center">
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
                    className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
                  >
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    ذخیره PDF / چاپ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-xs">
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
import React from 'react';
import { ProcessingStatus } from '../types';

interface StatusCardProps {
  status: ProcessingStatus;
  message?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ status, message }) => {
  if (status === ProcessingStatus.IDLE) return null;

  const getIcon = () => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return (
          <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case ProcessingStatus.ERROR:
        return (
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto mt-6 text-center transform transition-all duration-300 hover:scale-105 border border-gray-100 dark:border-gray-700">
      {getIcon()}
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">
        {status === ProcessingStatus.READING && "در حال خواندن فایل..."}
        {status === ProcessingStatus.OPTIMIZING && "بهینه‌سازی متن با هوش مصنوعی..."}
        {status === ProcessingStatus.GENERATING && "تولید فایل موبایل..."}
        {status === ProcessingStatus.COMPLETED && "عملیات موفقیت‌آمیز بود!"}
        {status === ProcessingStatus.ERROR && "خطا در پردازش"}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">{message || "لطفا شکیبا باشید"}</p>
    </div>
  );
};

export default StatusCard;

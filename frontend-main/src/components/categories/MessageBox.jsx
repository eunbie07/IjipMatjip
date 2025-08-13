import React from 'react'
import { Palette } from 'lucide-react';
// --- 알림 메시지 컴포넌트 ---
const MessageBox = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#ff7e97]/20 mb-4">
                    <Palette className="h-6 w-6 text-[#ff7e97]" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">알림</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full bg-[#ff7e97] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#ff6b87] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff7e97]"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default MessageBox
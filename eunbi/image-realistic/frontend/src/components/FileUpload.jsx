import { useRef } from 'react';

const FileUpload = ({ label, accept, icon, description, file, onFileChange }) => {
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    onFileChange(selectedFile);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-text-primary">{label}</label>
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-4xl mb-2">{icon}</div>
        {file ? (
          <div className="space-y-2">
            <p className="text-text-primary font-medium">{file.name}</p>
            <p className="text-text-secondary text-sm">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={handleButtonClick}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
            >
              파일 변경
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-text-secondary mb-2">{description}</p>
            <button
              type="button"
              onClick={handleButtonClick}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
            >
              파일 선택
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
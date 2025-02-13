import React, { useCallback, useState } from 'react';  // Added useState import
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiXCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const FileUpload = ({ onUpload }) => {
    const [rejectedFiles, setRejectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
  
    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
      setRejectedFiles(fileRejections);
      
      if (acceptedFiles.length > 0) {
        setIsUploading(true);
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Upload failed');
          const data = await response.json();
          
          onUpload(data);  // Call parent component's handler
        } catch (error) {
          console.error('Upload error:', error);
          alert(error.message);
        } finally {
          setIsUploading(false);
        }
      }
    }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-xl transition-all
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragActive ? 
            'border-amber-400 bg-amber-900/20' : 
            'border-gray-600 hover:border-amber-400'}
          ${rejectedFiles.length > 0 ? 'border-red-400' : ''}`}
        disabled={isUploading}
      >
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
              <p className="mt-4 text-amber-400">Processing dataset...</p>
            </div>
          ) : (
            <>
              <FiUploadCloud className="mx-auto h-12 w-12 text-amber-400" />
              <div>
                <p className="font-medium">
                  {isDragActive ? 'Release to upload' : 'Drag & drop dataset'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  CSV or Excel files (max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {rejectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-900/30 p-4 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-red-300">
            <FiXCircle className="flex-shrink-0" />
            <p>Invalid file: {rejectedFiles[0].file.name}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FileUpload;
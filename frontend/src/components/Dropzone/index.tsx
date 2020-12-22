import React, {useState, useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import {FiUpload} from 'react-icons/fi'

import './styles.css';

interface FileParams {
  onFileUploaded: (file: File) => void;
}

const Dropzone: React.FC<FileParams> = ({ onFileUploaded }) => {
  const [selectedFile, setSelectedFile] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];

    const fileUrl = URL.createObjectURL(file);

    setSelectedFile(fileUrl);
    onFileUploaded(file);
  }, [onFileUploaded]);

  const {getRootProps, getInputProps} = useDropzone({
    onDrop,
    accept: 'image/*',
  })

  return (
    <div className="dropzone" {...getRootProps()}>
      <input {...getInputProps()} />
     
      { selectedFile 
          ? <img src={selectedFile} alt="Imagem do estabelecimento"/>
          : (
            <p>
              <FiUpload />
              Imagem do estabelcimento.
            </p>
          )
      }
    </div>
  )
}

export default Dropzone;
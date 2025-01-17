import React from "react";

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-75'>
      <div className='relative'>
        <button
          onClick={onClose}
          className='absolute right-2 top-2 text-2xl text-white'
        >
          &times;
        </button>
        <img src={imageUrl} alt='Zoomed' className='max-h-screen max-w-full' />
      </div>
    </div>
  );
};

export default ImageModal;

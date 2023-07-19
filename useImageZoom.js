import { useEffect, useState } from 'react';

import { HOST_IMAGE_URL } from '@/constants/constants';

export const useImageZoom = (setIsModalOpen, setModalType, setModalData) => {
  const [image, setImage] = useState({
    path: '',
    about: '',
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [arrayOfImages, setArrayOfImages] = useState([]);

  const nextImage = (array) => {
    if (array && currentImageIndex >= 0 && currentImageIndex < array.length - 1) {
      setImage({
        path: `${HOST_IMAGE_URL}/${array[currentImageIndex + 1].path}`,
        about: array[currentImageIndex + 1].about,
      });
      setCurrentImageIndex((previous) => previous + 1);
    }
  };

  const previousImage = (array) => {
    if (array && currentImageIndex > 0) {
      setImage({
        path: `${HOST_IMAGE_URL}/${array[currentImageIndex - 1].path}`,
        about: array[currentImageIndex - 1].about,
      });
      setCurrentImageIndex((previous) => previous - 1);
    }
  };

  useEffect(() => {
    setModalData({
      arrayImages: arrayOfImages,
      imageUrl: image.path,
      imageDescription: image.about,
      currentImageIndex,
      previousImage,
      nextImage,
    });
  }, [image, currentImageIndex, arrayOfImages]);

  const handleZoomImage = (value, index, array) => {
    setImage(value);
    setIsModalOpen(true);
    setModalType('showBigImage');
    setCurrentImageIndex(index);
    setArrayOfImages(array);
    setModalData({
      arrayImages: array,
      imageUrl: value.path,
      imageDescription: value.about,
      currentImageIndex: index,
      previousImage,
      nextImage,
    });
  };

  return {
    handleZoomImage,
  };
};

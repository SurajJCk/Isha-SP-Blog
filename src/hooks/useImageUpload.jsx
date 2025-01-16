import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { toast } from "react-hot-toast";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.6 // Compression quality (0.6 = 60% quality)
        );
      };
    };
  });
};

const useImageUpload = () => {
  const auth = getAuth();
  const [progressState, setProgressState] = useState(0);
  const [loading, setLoading] = useState(false);

  const storeImage = async (image) => {
    if (!image) {
      toast.error("Please select an image");
      return null;
    }

    setLoading(true);
    try {
      const compressedImage = await compressImage(image);
      const fileName = `${auth.currentUser.uid}-${Date.now()}-${uuidv4()}`;
      const storage = getStorage();
      const storageRef = ref(storage, `BlogsImage/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, compressedImage);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgressState(progress);
          },
          (error) => {
            setLoading(false);
            toast.error("Upload failed");
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then(resolve)
              .catch(reject)
              .finally(() => setLoading(false));
          }
        );
      });
    } catch (error) {
      setLoading(false);
      toast.error("Image processing failed");
      throw error;
    }
  };

  return { storeImage, progressState, loading };
};

export default useImageUpload;

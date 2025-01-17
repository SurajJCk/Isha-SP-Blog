import { useEffect, useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { FaUpload } from "react-icons/fa";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const Profile = () => {
  const auth = getAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
    currentAvatarUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState(null);
  const { name, email, image, currentAvatarUrl } = formData;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setFormData({
            name: docSnap.data().name || "",
            email: docSnap.data().email || "",
            image: "",
            currentAvatarUrl: docSnap.data().avatarUrl || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error loading profile data");
      }
    };
    fetchUserData();
  }, [auth.currentUser.uid]);

  const storeImage = async () => {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(currentAvatarUrl);
        return;
      }

      if (image.size > 5 * 1024 * 1024) {
        reject(new Error("File size should be less than 5MB"));
        return;
      }

      const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
      const storage = getStorage();
      const storageRef = ref(storage, `Avatar/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgressState(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast.error("Unable to upload file");
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => resolve(downloadURL))
            .catch((error) => reject(error));
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.length < 2) {
      toast.error("Please enter a valid name (minimum 2 characters)");
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      const downloadedUrl = await storeImage();

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name,
        avatarUrl: downloadedUrl,
        lastUpdated: serverTimestamp(),
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.message.includes("5MB")) {
        toast.error("Image file size should be less than 5MB");
      } else {
        toast.error("Error updating profile");
      }
    } finally {
      setIsLoading(false);
      setProgressState(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFormData({
        ...formData,
        image: file,
      });
    }
  };

  return (
    <div className='mx-auto max-w-4xl px-4 py-8'>
      <h1 className='mb-8 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-center font-raleway text-4xl font-bold text-transparent'>
        Profile Settings
      </h1>

      <div className='rounded-lg bg-[#1a1a1a] p-6 shadow-xl'>
        <div className='mb-6 flex items-center justify-center'>
          <div className='relative h-24 w-24'>
            <img
              src={currentAvatarUrl || "/default-avatar.png"}
              alt='Profile'
              className='h-full w-full rounded-full object-cover'
            />
            <div className='absolute bottom-0 right-0'>
              <input
                onChange={handleImageChange}
                type='file'
                id='profileImage'
                style={{ display: "none" }}
                accept='.jpg,.png,.jpeg'
                disabled={isLoading}
              />
              <label
                htmlFor='profileImage'
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white ${
                  isLoading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <FaUpload className='text-gray-700' />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='form__group field relative'>
            <input
              type='text'
              value={name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='form__field bg-[#272727]'
              placeholder='Name'
              required
              minLength={2}
              disabled={isLoading}
            />
            <label className='form__label'>Name</label>
          </div>

          <div className='form__group field relative'>
            <input
              type='email'
              value={email}
              className='form__field bg-[#272727]'
              placeholder='Email'
              disabled
            />
            <label className='form__label'>Email (cannot be changed)</label>
          </div>

          {image && (
            <div className='text-sm text-gray-300'>
              New avatar selected: {image.name}
            </div>
          )}

          {progressState !== null && (
            <div className='mb-4'>
              <div className='h-2 w-full rounded-full bg-gray-700'>
                <div
                  className='h-2 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400'
                  style={{ width: `${progressState}%` }}
                />
              </div>
              <div className='mt-1 text-center text-sm text-gray-400'>
                {Math.round(progressState)}% uploaded
              </div>
            </div>
          )}

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={isLoading}
              className='rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 font-semibold text-white transition duration-200 ease-in-out hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

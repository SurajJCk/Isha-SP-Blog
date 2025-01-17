import { useState } from "react";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FcAddImage } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

const OAuth = () => {
  const navigate = useNavigate();
  const [showNameInput, setShowNameInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [image, setImage] = useState(null);
  const [tempUserData, setTempUserData] = useState(null);
  const [progressState, setProgressState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const userCredentials = await signInWithPopup(auth, provider);
      const user = userCredentials.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        // User exists, redirect to home
        toast.success("Welcome back!");
        navigate("/");
        return;
      }

      if (user) {
        setTempUserData(user);
        setShowNameInput(true);
        // Pre-fill name from Google account as default
        setCustomName(user.displayName || "");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled");
      } else {
        toast.error("Failed to sign in with Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const storeImage = async (user) => {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(tempUserData.photoURL); // Use Google photo if no custom image
        return;
      }

      // Validate file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        reject(new Error("File size should be less than 5MB"));
        return;
      }

      const fileName = `${user.uid}-${image.name}-${uuidv4()}`;
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

  const handleNameSubmit = async (e) => {
    e.preventDefault();

    if (!customName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (customName.length < 2) {
      toast.error("Name must be at least 2 characters long");
      return;
    }

    try {
      setIsLoading(true);
      const auth = getAuth();

      await updateProfile(auth.currentUser, {
        displayName: customName,
      });

      const downloadedUrl = await storeImage(auth.currentUser);

      await setDoc(
        doc(db, "users", tempUserData.uid),
        {
          name: customName,
          email: tempUserData.email,
          avatarUrl: downloadedUrl,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Profile created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.message.includes("5MB")) {
        toast.error("Image file size should be less than 5MB");
      } else {
        toast.error("Error saving profile data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setImage(file);
    }
  };

  if (showNameInput) {
    return (
      <div className='mx-auto my-8 w-full max-w-[70%]'>
        <form onSubmit={handleNameSubmit}>
          <div className='form__group field relative mb-4'>
            <input
              type='text'
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className='form__field bg-[#272727]'
              placeholder='Enter your name'
              required
              minLength={2}
              disabled={isLoading}
            />
            <label className='form__label'>Enter your preferred name</label>
          </div>

          <div className='mx-auto w-full max-w-[90%] py-4'>
            <input
              onChange={handleImageChange}
              type='file'
              id='googleFile'
              style={{ display: "none" }}
              accept='.jpg,.png,.jpeg'
              disabled={isLoading}
            />
            <label
              htmlFor='googleFile'
              className={`flex cursor-pointer items-center pl-3 text-left text-blue-50 ${
                isLoading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Add an avatar <FcAddImage size={24} className='ml-3' />
              {image && <span className='ml-2'>{image.name}</span>}
            </label>
          </div>

          {progressState !== null && (
            <div className='mb-4'>
              <div className='h-2 w-full rounded-full bg-gray-200'>
                <div
                  className='h-2 rounded-full bg-gradient-to-r from-rose-400 to-red-500'
                  style={{ width: `${progressState}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            type='submit'
            disabled={isLoading}
            className='google__btn__shadow flex w-full cursor-pointer items-center justify-center rounded-md bg-gradient-to-r from-rose-400 to-red-500 py-3 font-semibold text-white transition duration-200 ease-in-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isLoading ? "Processing..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className='mx-auto my-8 w-full max-w-[70%]'>
      <button
        onClick={signInWithGoogle}
        disabled={isLoading}
        className='google__btn__shadow flex w-full cursor-pointer items-center justify-center rounded-md bg-gradient-to-r from-rose-400 to-red-500 py-3 font-semibold text-white transition duration-200 ease-in-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <FcGoogle size={22} className='mr-2 rounded-full bg-white' />
        {isLoading ? "Connecting..." : "Sign in with google"}
      </button>
    </div>
  );
};

export default OAuth;

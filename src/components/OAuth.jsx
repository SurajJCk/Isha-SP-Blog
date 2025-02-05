import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { toast } from "react-hot-toast";
import { FcGoogle, FcAddImage } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
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
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        toast.error("No user data received");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        toast.success("Welcome back!");
        navigate("/");
        return;
      }

      setTempUserData(user);
      setShowNameInput(true);
      setCustomName(user.displayName || "");
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      switch (error.code) {
        case "auth/popup-closed-by-user":
          toast.error("Sign-in cancelled");
          break;
        case "auth/popup-blocked":
          toast.error("Enable pop-ups to sign in");
          break;
        case "auth/cancelled-popup-request":
          toast.error("Another sign-in in progress");
          break;
        default:
          toast.error("Sign-in failed. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const storeImage = async (user) => {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(tempUserData.photoURL); // Fallback to Google photo
        return;
      }

      const fileName = `${user.uid}-${image.name}-${uuidv4()}`;
      const storage = getStorage();
      const storageRef = ref(storage, `Avatar/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setProgressState(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
        },
        (error) => {
          toast.error("Image upload failed");
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then(resolve)
            .catch(reject);
        }
      );
    });
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();

    if (!customName.trim() || customName.length < 2) {
      toast.error("Enter a valid name (min 2 characters)");
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile(auth.currentUser, {
        displayName: customName,
      });

      const downloadedUrl = await storeImage(auth.currentUser);

      await setDoc(doc(db, "users", tempUserData.uid), {
        name: customName,
        email: tempUserData.email,
        avatarUrl: downloadedUrl || tempUserData.photoURL, // Double fallback
        timestamp: serverTimestamp(),
      });

      toast.success("Profile created!");
      navigate("/");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error.message.includes("5MB") 
          ? "Image must be <5MB" 
          : "Error saving profile"
      );
    } finally {
      setProgressState(null);
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size: 5MB");
      return;
    }
    setImage(file);
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
            <label className='form__label'>Preferred Name</label>
          </div>

          <div className='mx-auto w-full max-w-[90%] py-4'>
            <input
              onChange={handleImageChange}
              type='file'
              id='googleFile'
              style={{ display: "none" }}
              accept='.jpg,.png,.jpeg'
              disabled={isLoading}
              aria-label='Upload avatar'
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
        aria-label='Sign in with Google'
      >
        <FcGoogle size={22} className='mr-2 rounded-full bg-white' />
        {isLoading ? "Connecting..." : "Sign in with Google"}
      </button>
    </div>
  );
};

export default OAuth;
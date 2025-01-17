import {
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
} from "firebase/auth";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { db } from "../config/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FcAddImage } from "react-icons/fc";
import { v4 as uuidv4 } from "uuid";
import OAuth from "../components/OAuth";

const Register = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    image: "",
  });
  const [progressState, setProgressState] = useState(null);
  const { name, email, password, image } = formData;
  const [isLoading, setIsLoading] = useState(false);

  const onChangeHandler = (e) => {
    if (!e.target.files) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
    if (e.target.files) {
      const file = e.target.files[0];
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

  const storeImage = async () => {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(""); // No image case
        return;
      }

      // Validate file size (max 5MB)
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

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.length < 2) {
      toast.error("Please enter a valid name (minimum 2 characters)");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      const user = userCredentials.user;
      const downloadedUrl = await storeImage();

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        avatarUrl: downloadedUrl,
        timestamp: serverTimestamp(),
      });

      navigate("/");
      toast.success("Registration successful! Welcome!");
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already registered");
      } else if (error.message.includes("5MB")) {
        toast.error("Image file size should be less than 5MB");
      } else {
        toast.error("Error during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className='my-12 mb-20 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-center font-raleway text-5xl font-bold text-transparent'>
        Register Yourself
      </h1>
      <section className='mx-auto max-w-7xl'>
        <div className='h-full'>
          <div className='g-6 flex h-full flex-wrap items-center justify-center lg:justify-between'>
            <div className='shrink-1 mb-12 grow-0 basis-auto rounded-md bg-[#003f5c] md:mb-0 md:w-9/12 md:shrink-0 lg:w-6/12 xl:w-6/12'>
              <img
                src='/auth-illustration.webp'
                className='w-full'
                alt='Authentication illustration'
              />
            </div>

            <div className='mx-auto mb-12 mt-8 md:mb-0 md:w-8/12 lg:mt-0 lg:w-5/12 xl:w-5/12'>
              <form onSubmit={submitHandler}>
                <div className='form__group field relative mx-auto w-full max-w-[90%] py-4'>
                  <input
                    type='text'
                    id='name'
                    onChange={onChangeHandler}
                    value={name}
                    className='form__field bg-[#272727]'
                    placeholder='Name'
                    minLength={2}
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor='name' className='form__label'>
                    Full Name
                  </label>
                </div>

                <div className='form__group field relative mx-auto w-full max-w-[90%] py-4'>
                  <input
                    type='email'
                    id='email'
                    onChange={onChangeHandler}
                    value={email}
                    className='form__field bg-[#272727]'
                    placeholder='Email'
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor='email' className='form__label'>
                    Email address
                  </label>
                </div>

                <div className='form__group field relative mx-auto w-full max-w-[90%] py-4'>
                  <input
                    type='password'
                    id='password'
                    onChange={onChangeHandler}
                    value={password}
                    className='form__field bg-[#272727]'
                    placeholder='Password'
                    minLength={6}
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor='password' className='form__label'>
                    Password
                  </label>
                </div>

                <div className='mx-auto w-full max-w-[90%] py-4'>
                  <input
                    onChange={onChangeHandler}
                    type='file'
                    id='file'
                    style={{ display: "none" }}
                    accept='.jpg,.png,.jpeg'
                    disabled={isLoading}
                  />
                  <label
                    htmlFor='file'
                    className={`flex cursor-pointer items-center pl-3 text-left text-blue-50 ${
                      isLoading ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    Add an avatar <FcAddImage size={24} className='ml-3' />
                    {image && <span className='ml-2'>{image.name}</span>}
                  </label>
                </div>

                {progressState !== null && (
                  <div className='mx-auto mb-4 w-full max-w-[90%]'>
                    <div className='h-2 w-full rounded-full bg-gray-200'>
                      <div
                        className='h-2 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400'
                        style={{ width: `${progressState}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className='mx-auto flex w-full max-w-[90%] items-center justify-between'>
                  <p
                    onClick={() => !isLoading && navigate("/sign-in")}
                    className={`pt-3 text-gray-400 ${
                      isLoading ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    Already have an account?{" "}
                    <span className='bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent'>
                      Login now
                    </span>
                  </p>
                  <p
                    onClick={() => !isLoading && navigate("/forgot-password")}
                    className={`inline bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text pt-3 text-transparent hover:shadow-xl ${
                      isLoading ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    Forgot password?
                  </p>
                </div>

                <div className='mx-auto my-8 w-full max-w-[70%]'>
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='w-full cursor-pointer rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-semibold text-white transition duration-200 ease-in-out active:scale-90 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {isLoading ? "Processing..." : "Register"}
                  </button>
                </div>

                <div className='mx-auto my-4 mt-5 flex w-full max-w-[90%] items-center before:mt-0.5 before:flex-1 before:border-t before:border-gray-500 after:mt-0.5 after:flex-1 after:border-t after:border-gray-500'>
                  <p className='mx-4 mb-0 text-center font-semibold text-white'>
                    OR
                  </p>
                </div>
                <OAuth />
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;

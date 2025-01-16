import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { AiFillGoogleCircle } from "react-icons/ai";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { Balancer } from "react-wrap-balancer";
import Loader from "../components/Loader";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { email, password } = formData;
  const navigate = useNavigate();
  const auth = getAuth();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential.user) {
        navigate("/");
        toast.success("Signed in successfully");
      }
    } catch (error) {
      toast.error("Bad user credentials");
    } finally {
      setLoading(false);
    }
  };

  const provider = new GoogleAuthProvider();
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user is admin
      const isAdmin = user.email === "codewithsjc@gmail.com";

      // Add admin status to user profile
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName,
          email: user.email,
          isAdmin: isAdmin,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Navigate to admin dashboard if admin, otherwise home
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
      toast.success("Signed in with Google");
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in with Google");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className='mx-auto max-w-7xl'>
      <h1 className='bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text py-8 text-center font-raleway text-4xl font-extrabold text-transparent md:text-5xl'>
        <Balancer>Welcome Back</Balancer>
      </h1>
      <div className='mx-auto max-w-lg'>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-4 rounded-lg bg-white p-7 shadow-lg'
        >
          <input
            type='email'
            className='w-full rounded-lg border px-4 py-3 text-lg outline-none transition duration-150 ease-in-out hover:shadow-md'
            placeholder='Email address'
            id='email'
            value={email}
            onChange={onChange}
          />

          <div className='relative'>
            <input
              type={showPassword ? "text" : "password"}
              className='w-full rounded-lg border px-4 py-3 text-lg outline-none transition duration-150 ease-in-out hover:shadow-md'
              placeholder='Password'
              id='password'
              value={password}
              onChange={onChange}
            />
            {showPassword ? (
              <BsEyeSlashFill
                className='absolute right-3 top-4 cursor-pointer text-xl'
                onClick={() => setShowPassword((prevState) => !prevState)}
              />
            ) : (
              <BsEyeFill
                className='absolute right-3 top-4 cursor-pointer text-xl'
                onClick={() => setShowPassword((prevState) => !prevState)}
              />
            )}
          </div>

          <div className='flex justify-between text-sm'>
            <p>
              Don't have an account?{" "}
              <Link
                to='/sign-up'
                className='font-semibold text-blue-600 hover:text-blue-800'
              >
                Register
              </Link>
            </p>
            <Link
              to='/forgot-password'
              className='font-semibold text-blue-600 hover:text-blue-800'
            >
              Forgot password?
            </Link>
          </div>

          <button
            type='submit'
            className='rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white transition duration-150 ease-in-out hover:bg-blue-700'
          >
            Sign in
          </button>

          <div className='flex items-center'>
            <div className='flex-grow border-t'></div>
            <span className='mx-4 text-gray-500'>OR</span>
            <div className='flex-grow border-t'></div>
          </div>

          <button
            type='button'
            onClick={signInWithGoogle}
            className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-lg font-semibold text-gray-700 transition duration-150 ease-in-out hover:bg-gray-50 hover:shadow-md'
          >
            <AiFillGoogleCircle className='text-2xl text-red-500' />
            <span>Sign in with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import VisitorCounter from "./VisitorCounter";

const Header = () => {
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [show, setShow] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      });
    };
    checkStatus();
  }, [auth]);

  useEffect(() => {
    setShow(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        setIsAdmin(userDoc.data()?.isAdmin || false);
      }
    };

    checkAdminStatus();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      customClass: {
        container: "bg-gray-800",
        title: "text-white",
        content: "text-gray-300",
        confirmButton: "bg-blue-500 hover:bg-blue-700 text-white",
        cancelButton: "bg-green-500 hover:bg-red-700 text-white",
      },
    });

    if (result.isConfirmed) {
      try {
        const auth = getAuth();
        await signOut(auth);
        navigate("/");
        toast.success(
          "Logged Out, You have been logged out successfully",
          "success"
        );
      } catch (error) {
        console.log(error);
        toast.error(
          "Error",
          "An error occurred while loggin out. Please try again"
        );
      }
    }
  };

  const styles = {
    li: "hover:text-slate-300 ease-in-out transition duration-200 relative inline-block capitalize",
    mobileMenu: `absolute space-y-5 ease-in-out duration-500 transition-all text-2xl font-semibold ${
      show
        ? "translate-x-0 h-screen w-full top-12 bg-black justify-center"
        : "-translate-x-full top-12"
    } `,
  };
  return (
    <header className='header sticky top-0 z-40 bg-black'>
      <div className='relative mx-auto flex max-w-7xl items-center justify-between py-2 font-raleway'>
        <h1
          onClick={() => navigate("/")}
          className='logo cursor-pointer pl-8 text-xl sm:text-3xl font-bold'
        >
          Sadhanapada
        </h1>
        <div
          onClick={() => setShow(!show)}
          className='mr-3 cursor-pointer space-y-1 transition-all duration-200 ease-in-out md:hidden'
        >
          <span
            className={`block h-[2px] w-6 rounded-full bg-white transition-all duration-200 ease-in-out ${
              show ? "translate-y-2 rotate-[50deg]" : "translate-y-0 rotate-0"
            } `}
          ></span>
          <span
            className={`block h-[2px] w-6 rounded-full bg-white transition-all duration-200 ease-in-out ${
              show ? "opacity-0" : "opacity-100"
            } `}
          ></span>
          <span
            className={`block h-[2px] w-6 rounded-full bg-white transition-all duration-200 ease-in-out ${
              show
                ? "-translate-y-1 -rotate-[50deg]"
                : " translate-y-0 rotate-0"
            } `}
          ></span>
        </div>
        {/* Nav links */}
        <div
          className={`fixed md:static md:h-auto md:bg-transparent transition-all duration-500 ease-in flex items-center gap-6 ${
            show
              ? "top-12 h-screen w-full translate-x-0 flex-col bg-black"
              : "top-12 h-screen w-full -translate-x-full flex-col bg-black"
          } md:translate-x-0 md:flex-row`}
        >
          <div className="flex flex-col md:flex-row items-center gap-6 w-full px-4 md:px-0">
            <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-center">
              <VisitorCounter />
              <Link
                to="/"
                className="text-white hover:text-gray-300 text-base font-medium w-full md:w-auto text-center md:text-left"
              >
                Home
              </Link>
              <Link
                to="/games"
                className="text-white hover:text-gray-300 text-base font-medium w-full md:w-auto text-center md:text-left"
              >
                Games
              </Link>
              <Link
                to="/memes"
                className="text-white hover:text-gray-300 text-base font-medium w-full md:w-auto text-center md:text-left"
              >
                MemeZone
              </Link>
              <Link
                to="/sadhanapada-profiles"
                className="text-white hover:text-gray-300 text-base font-medium w-full md:w-auto text-center md:text-left"
              >
                Profiles
              </Link>
              <Link
                to="/articles"
                className="text-white hover:text-gray-300 text-base font-medium w-full md:w-auto text-center md:text-left"
              >
                Articles
              </Link>
            </div>
          </div>
          {authenticated && (
            <li
              className={`${styles.li} ${
                location.pathname === `/myblogs/${auth.currentUser.uid}` &&
                "highlight"
              } `}
            >
              <Link to={`/myblogs/${auth.currentUser.uid}`}>MyBlogs</Link>
            </li>
          )}

          {/* Write Blog */}
          {authenticated && (
            <li
              className={`${styles.li} ${
                location.pathname === "/write" && "highlight"
              } `}
            >
              <Link to='/write'>Write</Link>
            </li>
          )}

          {/* Profile Link */}
          {authenticated && (
            <li
              className={`${styles.li} ${
                location.pathname === "/profile" && "highlight"
              } `}
            >
              <Link to='/profile'>MyProfile</Link>
            </li>
          )}

          {authenticated ? (
            <button
              onClick={handleLogout}
              className={`${`${styles.li}`} mr-6 cursor-pointer rounded-md bg-gradient-to-r from-amber-500 to-pink-500 px-4 py-1 shadow-xl active:scale-95`}
            >
              logout
            </button>
          ) : (
            <li
              className={`${styles.li} ${
                location.pathname === "/sign-in" && "highlight"
              } `}
            >
              <Link to='/sign-in'>sign-in</Link>
            </li>
          )}

          {isAdmin && (
            <Link
              to='/admin'
              className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
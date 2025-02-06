import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import Articles from "./pages/Articles";
import Category from "./pages/Category";
import SingleArticle from "./pages/SingleArticle";
import SearchResults from "./pages/SearchResults";
import WriteBlog from "./pages/WriteBlog";
import EditArticle from "./pages/EditArticle";
import MyBlogs from "./pages/MyBlogs";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import ForgotPassword from "./pages/ForgotPassword";
import Logout from "./pages/Logout";
import Profile from "./pages/Profile";
import Games from './pages/Games';
import MemeContest from './pages/MemeContest';
import IntroAnimation from './components/IntroAnimation';
import SadhanapadaProfile from './pages/SadhanapadaProfile';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {showIntro ? (
          <>
            <IntroAnimation onComplete={handleIntroComplete} />
            <button
              className="fixed top-4 right-4 px-6 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-full hover:from-black hover:to-gray-800 transition-all duration-300 text-sm font-medium z-50 shadow-lg"
              onClick={handleIntroComplete}
            >
              Visit Site →
            </button>
          </>
        ) : (
          <>
            <Header />
            <Toaster
              position='top-center'
              reverseOrder={false}
              gutter={8}
              containerClassName=''
              containerStyle={{}}
              toastOptions={{
                className: "",
                duration: 5000,
                style: {
                  background: "#333",
                  color: "#fff",
                  marginTop: "50px",
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: "green",
                    secondary: "black",
                  },
                  iconTheme: {
                    primary: "green",
                    secondary: "#333",
                  },
                  ariaProps: {
                    role: "status",
                    "aria-live": "polite",
                  },
                  enter: "fade",
                  exit: "fade",
                },
              }}
            />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/home' element={<Home />} />
                <Route path='/games' element={<Games />} />
                <Route path='/memes' element={<MemeContest />} />
                {/* Private Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path='/myBlogs/:userId' element={<MyBlogs />} />
                  <Route path='/write' element={<WriteBlog />} />
                  <Route path='/profile' element={<Profile />} />
                </Route>
                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path='/admin' element={<AdminDashboard />} />
                </Route>
                {/* Public Routes */}
                <Route path='/articles' element={<Articles />} />
                <Route path='/sign-in' element={<SignIn />} />
                <Route path={`/category/:categoryName`} element={<Category />} />
                <Route
                  path={`/category/:categoryName/:articleId`}
                  element={<SingleArticle />}
                />
                <Route path='/search/:query' element={<SearchResults />} />
                <Route path={`/edit/:articleId`} element={<EditArticle />} />
                <Route path='/sign-up' element={<Register />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/sign-out' element={<Logout />} />
                <Route path="/sadhanapada-profiles" element={<SadhanapadaProfile />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;

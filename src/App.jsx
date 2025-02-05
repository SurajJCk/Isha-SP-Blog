import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import MyBlogs from "./pages/MyBlogs";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import ForgotPassword from "./pages/ForgotPassword";
import Articles from "./pages/Articles";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/PrivateRoute";
import WriteBlog from "./pages/WriteBlog";
import SingleArticle from "./pages/SingleArticle";
import Category from "./pages/Category";
import EditArticle from "./pages/EditArticle";
import SearchResults from "./pages/SearchResults";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Games from './pages/Games';

const App = () => {
  /* 
  TODO -  Add image input in write blog component, add the image to cloud storage in firebase
  
   */

  return (
    <div>
      <Router>
        <Header />

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/games' element={<Games />} />
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
        </Routes>
      </Router>
      <Toaster
        position='top-center'
        reverseOrder={false}
        gutter={8}
        containerClassName=''
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: "",
          duration: 5000,
          style: {
            background: "#333",
            // 363636
            color: "#fff",
            marginTop: "50px",
          },
          // Default options for specific types
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
            // Custom toast icon style
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
    </div>
  );
};

export default App;

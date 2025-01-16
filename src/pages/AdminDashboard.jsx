import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";

const AdminDashboard = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all posts
        const postsSnap = await getDocs(collection(db, "blogs"));
        const posts = postsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllPosts(posts);

        // Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllUsers(users);

        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Error fetching data");
      }
    };

    fetchAllData();
  }, []);

  const deletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, "blogs", postId));
      setAllPosts((posts) => posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className='mx-auto max-w-7xl p-4'>
      <h1 className='mb-8 text-3xl font-bold'>Admin Dashboard</h1>

      {/* Posts Section */}
      <div className='mb-8'>
        <h2 className='mb-4 text-2xl font-semibold'>All Posts</h2>
        <div className='grid gap-4'>
          {allPosts.map((post) => (
            <div key={post.id} className='rounded-lg border p-4'>
              <h3 className='font-medium'>{post.blogData.title}</h3>
              <p className='text-sm text-gray-600'>By: {post.author.name}</p>
              <button
                onClick={() => deletePost(post.id)}
                className='mt-2 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600'
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className='mb-4 text-2xl font-semibold'>All Users</h2>
        <div className='grid gap-4'>
          {allUsers.map((user) => (
            <div key={user.id} className='rounded-lg border p-4'>
              <p className='font-medium'>{user.name}</p>
              <p className='text-sm text-gray-600'>{user.email}</p>
              <p className='text-xs text-gray-500'>
                {user.isAdmin ? "Admin" : "User"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

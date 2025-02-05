import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";
import dayjs from "dayjs";

const AdminDashboard = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all posts with ordering
        const postsQuery = query(
          collection(db, "blogs"),
          orderBy("timestamp", "desc")
        );
        const postsSnap = await getDocs(postsQuery);
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
        console.error("Error fetching data:", error);
        toast.error("Error fetching data");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const deletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, "blogs", postId));
        setAllPosts((posts) => posts.filter((post) => post.id !== postId));
        toast.success("Post deleted successfully");
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Error deleting post");
      }
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isAdmin: !currentStatus,
      });
      
      // Update local state
      setAllUsers(users =>
        users.map(user =>
          user.id === userId
            ? { ...user, isAdmin: !currentStatus }
            : user
        )
      );
      
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Error updating user role");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className='mx-auto max-w-7xl p-4'>
      <h1 className='mb-8 text-3xl font-bold text-white'>Admin Dashboard</h1>

      {/* Posts Section */}
      <div className='mb-12'>
        <h2 className='mb-4 text-2xl font-semibold text-white'>All Posts ({allPosts.length})</h2>
        <div className='grid gap-4'>
          {allPosts.map((post) => (
            <div
              key={post.id}
              className='rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700'
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className='font-medium text-white'>{post.title}</h3>
                  <p className='text-sm text-gray-400'>By: {post.author?.name}</p>
                  <p className='text-sm text-gray-500'>
                    Category: {post.category}
                  </p>
                  <p className='text-xs text-gray-500'>
                    Posted: {post.timestamp ? dayjs(post.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className='rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className='mb-4 text-2xl font-semibold text-white'>All Users ({allUsers.length})</h2>
        <div className='grid gap-4'>
          {allUsers.map((user) => (
            <div
              key={user.id}
              className='rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700'
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className='font-medium text-white'>{user.name}</p>
                  <p className='text-sm text-gray-400'>{user.email}</p>
                  <p className='text-xs text-gray-500'>
                    Role: {user.isAdmin ? "Admin" : "User"}
                  </p>
                </div>
                <button
                  onClick={() => toggleUserAdmin(user.id, user.isAdmin)}
                  className={`rounded px-3 py-1 text-white transition-colors ${
                    user.isAdmin
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  orderBy
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import CardSkeleton from "../components/skeleton/CardSkeleton";
import { HiOutlineTrash } from "react-icons/hi";

const MyBlogs = () => {
  const [userBlog, setUserBlog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    const fetchUserBlogs = async () => {
      if (!currentUser) return;

      try {
        const blogRef = collection(db, "blogs");
        const q = query(
          blogRef, 
          where("author.id", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const blogs = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            data: {
              title: data.blogData.title,
              content: data.blogData.content,
              category: data.blogData.category,
              imageUrl: data.imageUrl,
              timestamp: data.timestamp,
              author: data.author
            },
            likeCount: data.likes?.count || 0,
            dislikeCount: data.dislikes?.count || 0,
            userAction: data.likes?.userIds?.includes(currentUser.uid)
              ? "like"
              : data.dislikes?.userIds?.includes(currentUser.uid)
              ? "dislike"
              : null,
          };
        });
        setUserBlog(blogs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user blogs:", error);
        toast.error("Unable to load your articles");
        setLoading(false);
      }
    };

    fetchUserBlogs();
  }, [currentUser]);

  const handleVote = async (blogId, action) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const blogIndex = userBlog.findIndex((blog) => blog.id === blogId);
      if (blogIndex === -1) return;

      const blog = userBlog[blogIndex];
      const blogRef = doc(db, "blogs", blogId);
      
      // First, get the current blog data
      const blogDoc = await getDoc(blogRef);
      if (!blogDoc.exists()) {
        toast.error("Blog not found");
        return;
      }
      
      const currentData = blogDoc.data();
      let updates = {};

      if (blog.userAction === action) {
        // User is un-voting
        if (action === 'like') {
          updates.likes = {
            userIds: Array.isArray(currentData.likes?.userIds) 
              ? currentData.likes.userIds.filter(id => id !== currentUser.uid)
              : [],
            count: Math.max((currentData.likes?.count || 1) - 1, 0)
          };
        } else {
          updates.dislikes = {
            userIds: Array.isArray(currentData.dislikes?.userIds)
              ? currentData.dislikes.userIds.filter(id => id !== currentUser.uid)
              : [],
            count: Math.max((currentData.dislikes?.count || 1) - 1, 0)
          };
        }

        // Update local state
        const updatedBlogs = [...userBlog];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: Math.max(blog[`${action}Count`] - 1, 0),
          userAction: null,
        };
        setUserBlog(updatedBlogs);
      } else {
        // User is voting or changing vote
        if (action === 'like') {
          updates.likes = {
            userIds: Array.isArray(currentData.likes?.userIds)
              ? [...new Set([...currentData.likes.userIds, currentUser.uid])]
              : [currentUser.uid],
            count: (currentData.likes?.count || 0) + 1
          };
          
          // If user had previously disliked, remove dislike
          if (blog.userAction === 'dislike') {
            updates.dislikes = {
              userIds: Array.isArray(currentData.dislikes?.userIds)
                ? currentData.dislikes.userIds.filter(id => id !== currentUser.uid)
                : [],
              count: Math.max((currentData.dislikes?.count || 1) - 1, 0)
            };
          }
        } else {
          updates.dislikes = {
            userIds: Array.isArray(currentData.dislikes?.userIds)
              ? [...new Set([...currentData.dislikes.userIds, currentUser.uid])]
              : [currentUser.uid],
            count: (currentData.dislikes?.count || 0) + 1
          };
          
          // If user had previously liked, remove like
          if (blog.userAction === 'like') {
            updates.likes = {
              userIds: Array.isArray(currentData.likes?.userIds)
                ? currentData.likes.userIds.filter(id => id !== currentUser.uid)
                : [],
              count: Math.max((currentData.likes?.count || 1) - 1, 0)
            };
          }
        }

        // Update local state
        const updatedBlogs = [...userBlog];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: blog[`${action}Count`] + 1,
          [`${action === "like" ? "dislikeCount" : "likeCount"}`]:
            blog.userAction
              ? Math.max(blog[`${action === "like" ? "dislikeCount" : "likeCount"}`] - 1, 0)
              : blog[`${action === "like" ? "dislikeCount" : "likeCount"}`],
          userAction: action,
        };
        setUserBlog(updatedBlogs);
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "blogs", id));
      toast.success("Article deleted successfully");
      setUserBlog((prev) => prev.filter((blog) => blog.id !== id));
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete article");
    }
  };

  return (
    <div className='mx-auto max-w-7xl'>
      <h1 className='my-12 text-center text-4xl font-extrabold'>
        My Articles
      </h1>

      <div className='mx-auto mt-12 grid w-[80%] grid-cols-1 gap-5 md:w-[95%] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : userBlog && userBlog.length > 0 ? (
          userBlog.map((blog) => (
            <Card
              key={blog.id}
              id={blog.id}
              blog={blog.data}
              likeCount={blog.likeCount}
              dislikeCount={blog.dislikeCount}
              userAction={blog.userAction}
              onVote={handleVote}
              delHandler={handleDelete}
            />
          ))
        ) : (
          <p className='mt-24 text-center text-4xl font-extrabold'>
            You have not post any article yet!!
          </p>
        )}
      </div>
    </div>
  );
};

export default MyBlogs;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  addDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { toast } from "react-hot-toast";
import Card from "../components/Card";
import CardSkeleton from "../components/skeleton/CardSkeleton";
import Loader from "../components/Loader";

const Category = () => {
  const [blogData, setBlogData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const params = useParams();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const adminRef = collection(db, "admin");
        const q = query(adminRef, where("id", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setIsAdmin(!querySnapshot.empty);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryRef = collection(db, "categories");
        const q = query(categoryRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const categoryData = [];
        querySnapshot.forEach((doc) => {
          categoryData.push({ id: doc.id, ...doc.data() });
        });
        setCategories(categoryData);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch blogs by category
  useEffect(() => {
    const fetchData = async () => {
      if (!params.categoryName) return;

      setLoading(true);
      try {
        const blogRef = collection(db, "blogs");
        const q = query(
          blogRef,
          where("category", "==", params.categoryName),
          orderBy("timestamp", "desc"),
          limit(6)
        );
        const docSnap = await getDocs(q);
        const blogs = docSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            data: {
              title: data.title,
              content: data.content,
              category: data.category,
              imageUrl: data.imageUrl,
              timestamp: data.timestamp,
            },
            likeCount: data.likes?.count || 0,
            dislikeCount: data.dislikes?.count || 0,
            userAction: currentUser
              ? data.likes?.userIds?.includes(currentUser.uid)
                ? "like"
                : data.dislikes?.userIds?.includes(currentUser.uid)
                ? "dislike"
                : null
              : null,
          };
        });
        setBlogData(blogs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        toast.error("Failed to load articles");
        setLoading(false);
      }
    };
    fetchData();
  }, [params.categoryName, currentUser]);

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    try {
      const categoryRef = collection(db, "categories");
      await addDoc(categoryRef, {
        name: newCategory,
        timestamp: new Date(),
      });
      toast.success("Category added successfully");
      setNewCategory("");
      setError("");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleVote = async (blogId, action) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const blogIndex = blogData.findIndex((blog) => blog.id === blogId);
      if (blogIndex === -1) return;

      const blog = blogData[blogIndex];
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
        const updatedBlogs = [...blogData];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: Math.max(blog[`${action}Count`] - 1, 0),
          userAction: null,
        };
        setBlogData(updatedBlogs);
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
        const updatedBlogs = [...blogData];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: blog[`${action}Count`] + 1,
          [`${action === "like" ? "dislikeCount" : "likeCount"}`]:
            blog.userAction
              ? Math.max(blog[`${action === "like" ? "dislikeCount" : "likeCount"}`] - 1, 0)
              : blog[`${action === "like" ? "dislikeCount" : "likeCount"}`],
          userAction: action,
        };
        setBlogData(updatedBlogs);
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  return (
    <div className='mx-auto max-w-7xl'>
      {/* Category Management Section */}
      {isAdmin && (
        <div className='my-8 rounded-lg bg-white p-6 shadow-lg'>
          <h2 className='mb-4 text-2xl font-bold'>Manage Categories</h2>
          <form onSubmit={handleAddCategory} className='mb-4'>
            <input
              type='text'
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='Enter new category'
              className='mr-2 rounded border p-2'
            />
            <button
              type='submit'
              className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
            >
              Add Category
            </button>
            {error && <p className='mt-2 text-red-500'>{error}</p>}
          </form>
          <div className='mt-4'>
            {categories.map((category) => (
              <div
                key={category.id}
                className='mb-2 flex items-center justify-between'
              >
                <span>{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className='text-red-500 hover:text-red-700'
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Section */}
      <h1 className='my-12 text-center text-4xl font-extrabold'>
        {params.categoryName} Articles
      </h1>

      <div className='mx-auto mt-12 grid w-[80%] grid-cols-1 gap-5 md:w-[95%] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : blogData && blogData.length > 0 ? (
          blogData.map((blog) => (
            <Card
              key={blog.id}
              id={blog.id}
              blog={blog.data}
              likeCount={blog.likeCount}
              dislikeCount={blog.dislikeCount}
              userAction={blog.userAction}
              onVote={handleVote}
            />
          ))
        ) : (
          <p className='mt-24 text-center text-4xl font-extrabold'>
            No articles found in this category
          </p>
        )}
      </div>
    </div>
  );
};

export default Category;

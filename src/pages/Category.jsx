import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Card from "../components/Card";
import Loader from "../components/Loader";
import CardSkeleton from "../components/skeleton/CardSkeleton";

const Category = () => {
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const auth = getAuth();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        setIsAdmin(userSnap.data()?.isAdmin || false);
      }
    };
    checkAdminStatus();
  }, [auth.currentUser]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const querySnap = await getDocs(categoriesRef);
        const categoryList = [];
        querySnap.forEach((doc) => {
          categoryList.push({
            id: doc.id,
            name: doc.data().name,
          });
        });
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch blog posts for selected category
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const blogRef = collection(db, "blogs");
        const q = query(
          blogRef,
          where(`blogData.category`, "==", params.categoryName),
          orderBy("timestamp", "desc"),
          limit(6)
        );
        const querySnap = await getDocs(q);
        const blogs = [];
        querySnap.forEach((query) => {
          blogs.push({
            id: query.id,
            data: query.data(),
          });
        });
        setBlogData(blogs);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.categoryName]);

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    try {
      const categoriesRef = collection(db, "categories");
      // Check if category already exists
      const q = query(categoriesRef, where("name", "==", newCategory.trim()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        setError("Category already exists");
        return;
      }

      await addDoc(categoriesRef, {
        name: newCategory.trim(),
        createdAt: new Date(),
        createdBy: auth.currentUser.uid,
      });

      setCategories([...categories, { name: newCategory.trim() }]);
      setNewCategory("");
      setError("");
    } catch (error) {
      setError("Error adding category");
      console.error("Error adding category:", error);
    }
  };

  // Delete category (admin only)
  const handleDeleteCategory = async (categoryId) => {
    if (!isAdmin) return;

    try {
      // Check if category has any blogs
      const blogRef = collection(db, "blogs");
      const q = query(blogRef, where("blogData.category", "==", categoryId));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        setError("Cannot delete category with existing blogs");
        return;
      }

      await deleteDoc(doc(db, "categories", categoryId));
      setCategories(categories.filter((cat) => cat.id !== categoryId));
    } catch (error) {
      setError("Error deleting category");
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className='mx-auto max-w-7xl'>
      {/* Category Management Section */}
      {auth.currentUser && (
        <div className='mb-8 rounded-lg bg-white p-4 shadow'>
          <h2 className='mb-4 text-2xl font-bold'>Manage Categories</h2>
          <form onSubmit={handleAddCategory} className='mb-4 flex gap-4'>
            <input
              type='text'
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='New category name'
              className='flex-1 rounded border p-2'
            />
            <button
              type='submit'
              className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Add Category
            </button>
          </form>
          {error && <p className='mb-4 text-red-500'>{error}</p>}

          <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
            {categories.map((category) => (
              <div
                key={category.id}
                className='flex items-center justify-between rounded bg-gray-100 p-2'
              >
                <span>{category.name}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className='text-red-600 hover:text-red-800'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Category Display Section */}
      <h1 className='my-12 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-center text-5xl font-bold text-transparent'>
        Articles related to:{" "}
        <span className='bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text font-extrabold capitalize text-transparent'>
          {params.categoryName}
        </span>
      </h1>

      <div className='mx-auto mt-12 grid w-[80%] grid-cols-1 gap-5 md:w-[95%] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : blogData && blogData.length > 0 ? (
          blogData.map((blog, index) => (
            <Card key={blog.id} id={blog.id} blog={blog.data} />
          ))
        ) : (
          <p className='mt-24 text-center text-4xl font-extrabold'>
            No Articles found
          </p>
        )}
      </div>
    </div>
  );
};

export default Category;

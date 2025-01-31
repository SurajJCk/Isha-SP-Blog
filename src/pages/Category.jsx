import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  orderBy,
  doc
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { toast } from "react-hot-toast";
import Card from "../components/Card";
import CardSkeleton from "../components/skeleton/CardSkeleton";
import Loader from "../components/Loader";

const categories = [
  { id: 1, name: "Technology" },
  { id: 2, name: "Sports" },
  { id: 3, name: "Politics" },
  { id: 4, name: "Entertainment" },
  { id: 5, name: "Business" },
];

const Category = () => {
  const [blogData, setBlogData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const blogRef = collection(db, "blogs");
        const q = query(
          blogRef,
          where("category", "==", params.category),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const blogs = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            data: {
              title: data.title,
              content: data.content,
              category: data.category,
              imageUrl: data.imageUrl,
              timestamp: data.timestamp,
              author: data.author
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
      } catch (error) {
        console.error("Error fetching blogs:", error);
        toast.error("Unable to load articles");
      }
      setLoading(false);
    };

    if (params.category) {
      fetchBlogs();
    }
  }, [params.category, currentUser]);

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
      
      const blogDoc = await getDoc(blogRef);
      if (!blogDoc.exists()) {
        toast.error("Blog not found");
        return;
      }
      
      const currentData = blogDoc.data();
      let updates = {};

      if (blog.userAction === action) {
        if (action === 'like') {
          updates.likes = {
            userIds: currentData.likes?.userIds.filter(id => id !== currentUser.uid) || [],
            count: Math.max((currentData.likes?.count || 1) - 1, 0)
          };
        } else {
          updates.dislikes = {
            userIds: currentData.dislikes?.userIds.filter(id => id !== currentUser.uid) || [],
            count: Math.max((currentData.dislikes?.count || 1) - 1, 0)
          };
        }
      } else {
        if (action === 'like') {
          updates.likes = {
            userIds: [...(currentData.likes?.userIds || []), currentUser.uid],
            count: (currentData.likes?.count || 0) + 1
          };
          if (blog.userAction === 'dislike') {
            updates.dislikes = {
              userIds: currentData.dislikes?.userIds.filter(id => id !== currentUser.uid) || [],
              count: Math.max((currentData.dislikes?.count || 1) - 1, 0)
            };
          }
        } else {
          updates.dislikes = {
            userIds: [...(currentData.dislikes?.userIds || []), currentUser.uid],
            count: (currentData.dislikes?.count || 0) + 1
          };
          if (blog.userAction === 'like') {
            updates.likes = {
              userIds: currentData.likes?.userIds.filter(id => id !== currentUser.uid) || [],
              count: Math.max((currentData.likes?.count || 1) - 1, 0)
            };
          }
        }
      }

      await updateDoc(blogRef, updates);

      const updatedBlogs = [...blogData];
      updatedBlogs[blogIndex] = {
        ...blog,
        likeCount: updates.likes?.count ?? blog.likeCount,
        dislikeCount: updates.dislikes?.count ?? blog.dislikeCount,
        userAction: blog.userAction === action ? null : action
      };
      setBlogData(updatedBlogs);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <CardSkeleton key={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center capitalize">
        {params.category} Articles
      </h1>
      {blogData?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogData.map((blog) => (
            <Card
              key={blog.id}
              blog={blog.data}
              id={blog.id}
              likeCount={blog.likeCount}
              dislikeCount={blog.dislikeCount}
              userAction={blog.userAction}
              onVote={handleVote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <p>No articles found in this category.</p>
          <button
            onClick={() => navigate("/write")}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Write the First Article
          </button>
        </div>
      )}
    </div>
  );
};

export default Category;

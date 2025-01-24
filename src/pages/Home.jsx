/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import Search from "../components/Search";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Card from "../components/Card";
import Hero from "../components/Hero";
import { Balancer } from "react-wrap-balancer";
import Tags from "../components/common/Tags";
import Loader from "../components/Loader";
import CardSkeleton from "../components/skeleton/CardSkeleton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

const Home = () => {
  const [latestBlogs, setLatestBlogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      setLoading(true);
      const blogRef = collection(db, "blogs");
      const q = query(blogRef, orderBy("timestamp", "desc"), limit(6));
      const docSnap = await getDocs(q);
      let blogs = [];
      docSnap.forEach((doc) => {
        const data = doc.data();
        blogs.push({
          id: doc.id,
          data: {
            title: data.blogData?.title,
            content: data.blogData?.content,
            category: data.blogData?.category,
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
        });
      });
      setLatestBlogs(blogs);
      setLoading(false);
    };
    fetchLatestArticles();
  }, [currentUser]);

  const handleVote = async (blogId, action) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const blogIndex = latestBlogs.findIndex((blog) => blog.id === blogId);
      if (blogIndex === -1) return;

      const blog = latestBlogs[blogIndex];
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
        const updatedBlogs = [...latestBlogs];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: Math.max(blog[`${action}Count`] - 1, 0),
          userAction: null,
        };
        setLatestBlogs(updatedBlogs);
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
        const updatedBlogs = [...latestBlogs];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: blog[`${action}Count`] + 1,
          [`${action === "like" ? "dislikeCount" : "likeCount"}`]:
            blog.userAction
              ? Math.max(blog[`${action === "like" ? "dislikeCount" : "likeCount"}`] - 1, 0)
              : blog[`${action === "like" ? "dislikeCount" : "likeCount"}`],
          userAction: action,
        };
        setLatestBlogs(updatedBlogs);
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  return (
    <div className='mx-auto max-w-7xl transition-all duration-300 ease-in-out'>
      <div>
        <Hero />
      </div>
      {/* Categories */}
      <Tags />

      {/* Articles */}
      <div>
        <h1 className='my-12 pl-2 text-3xl font-extrabold md:pl-9 md:text-4xl'>
          <Balancer>Latest articles on the web</Balancer>
        </h1>
        <div className=' mx-auto grid w-[80%] grid-cols-1 gap-5 md:w-[95%] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : latestBlogs && latestBlogs.length > 0 ? (
            latestBlogs.map((blog, index) => (
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
              No Article found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

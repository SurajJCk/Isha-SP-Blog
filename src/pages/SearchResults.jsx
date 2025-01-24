/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import Search from "../components/Search";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { collection, getDocs, orderBy, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Card from "../components/Card";
import CardSkeleton from "../components/skeleton/CardSkeleton";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const SearchResults = () => {
  const { query: searchQuery } = useParams();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const blogRef = collection(db, "blogs");
        const q = query(blogRef);
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const titleMatch = data.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const contentMatch = data.content
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          if (titleMatch || contentMatch) {
            results.push({
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
            });
          }
        });
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching:", error);
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      fetchSearchResults();
    }
  }, [searchQuery, currentUser]);

  const handleVote = async (blogId, action) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const blogIndex = searchResults.findIndex((blog) => blog.id === blogId);
      if (blogIndex === -1) return;

      const blog = searchResults[blogIndex];
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
        const updatedResults = [...searchResults];
        updatedResults[blogIndex] = {
          ...blog,
          [`${action}Count`]: Math.max(blog[`${action}Count`] - 1, 0),
          userAction: null,
        };
        setSearchResults(updatedResults);
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
        const updatedResults = [...searchResults];
        updatedResults[blogIndex] = {
          ...blog,
          [`${action}Count`]: blog[`${action}Count`] + 1,
          [`${action === "like" ? "dislikeCount" : "likeCount"}`]:
            blog.userAction
              ? Math.max(blog[`${action === "like" ? "dislikeCount" : "likeCount"}`] - 1, 0)
              : blog[`${action === "like" ? "dislikeCount" : "likeCount"}`],
          userAction: action,
        };
        setSearchResults(updatedResults);
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  return (
    <main className='mx-auto max-w-7xl'>
      <div className='my-12'>
        <Search />
      </div>

      <section>
        {!loading ? (
          searchResults.length > 0 ? (
            searchResults.map((blog) => (
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
              No results found for "{searchQuery}"
            </p>
          )
        ) : (
          <div className='mx-auto mt-12 grid w-[95%] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default SearchResults;

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
        const q = query(blogRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Check if the required fields exist before accessing
          if (data && data.title && data.content) {
            const titleMatch = data.title
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const contentMatch = data.content
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            if (titleMatch || contentMatch) {
              results.push({
                id: doc.id,
                ...data,
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
        if (action === "like") {
          updates = {
            likes: {
              count: (currentData.likes?.count || 1) - 1,
              userIds: (currentData.likes?.userIds || []).filter(
                (id) => id !== currentUser.uid
              ),
            },
          };
        } else {
          updates = {
            dislikes: {
              count: (currentData.dislikes?.count || 1) - 1,
              userIds: (currentData.dislikes?.userIds || []).filter(
                (id) => id !== currentUser.uid
              ),
            },
          };
        }
        
        // Update local state
        setSearchResults((prevResults) => {
          const newResults = [...prevResults];
          newResults[blogIndex] = {
            ...newResults[blogIndex],
            userAction: null,
            likeCount:
              action === "like"
                ? newResults[blogIndex].likeCount - 1
                : newResults[blogIndex].likeCount,
            dislikeCount:
              action === "dislike"
                ? newResults[blogIndex].dislikeCount - 1
                : newResults[blogIndex].dislikeCount,
          };
          return newResults;
        });
      } else {
        // User is voting or changing vote
        if (action === "like") {
          updates = {
            likes: {
              count: (currentData.likes?.count || 0) + 1,
              userIds: [...(currentData.likes?.userIds || []), currentUser.uid],
            },
          };
          if (blog.userAction === "dislike") {
            updates.dislikes = {
              count: (currentData.dislikes?.count || 1) - 1,
              userIds: (currentData.dislikes?.userIds || []).filter(
                (id) => id !== currentUser.uid
              ),
            };
          }
        } else {
          updates = {
            dislikes: {
              count: (currentData.dislikes?.count || 0) + 1,
              userIds: [...(currentData.dislikes?.userIds || []), currentUser.uid],
            },
          };
          if (blog.userAction === "like") {
            updates.likes = {
              count: (currentData.likes?.count || 1) - 1,
              userIds: (currentData.likes?.userIds || []).filter(
                (id) => id !== currentUser.uid
              ),
            };
          }
        }
        
        // Update local state
        setSearchResults((prevResults) => {
          const newResults = [...prevResults];
          newResults[blogIndex] = {
            ...newResults[blogIndex],
            userAction: action,
            likeCount:
              action === "like"
                ? newResults[blogIndex].likeCount + 1
                : blog.userAction === "like"
                ? newResults[blogIndex].likeCount - 1
                : newResults[blogIndex].likeCount,
            dislikeCount:
              action === "dislike"
                ? newResults[blogIndex].dislikeCount + 1
                : blog.userAction === "dislike"
                ? newResults[blogIndex].dislikeCount - 1
                : newResults[blogIndex].dislikeCount,
          };
          return newResults;
        });
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  return (
    <div className='mx-auto mt-10 max-w-7xl'>
      <div className='mb-10'>
        <Search />
      </div>
      <div className='mx-4'>
        <h2 className='mb-6 text-2xl font-bold text-white'>
          Search Results for "{searchQuery}" ({searchResults.length})
        </h2>
        {loading ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((item) => (
              <CardSkeleton key={item} />
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {searchResults.map((blog) => (
              <Card
                key={blog.id}
                id={blog.id}
                blog={blog}
                userAction={blog.userAction}
                likeCount={blog.likeCount}
                dislikeCount={blog.dislikeCount}
                onVote={handleVote}
              />
            ))}
          </div>
        ) : (
          <p className='text-center text-gray-500'>No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

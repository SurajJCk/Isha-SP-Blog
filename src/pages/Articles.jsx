import { useEffect, useState } from "react";
import Search from "../components/Search";
import Card from "../components/Card";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";
import Tags from "../components/common/Tags";
import InfiniteScroll from "react-infinite-scroll-component";
import CardSkeleton from "../components/skeleton/CardSkeleton";

const Articles = () => {
  const [blogsData, setBlogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastBlog, setLastBlog] = useState(null);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const fetchBlogs = async () => {
    try {
      const blogRef = collection(db, "blogs");
      const q = query(blogRef, orderBy("timestamp", "desc"), limit(6));
      const docSnap = await getDocs(q);
      const lastVisible = docSnap.docs[docSnap.docs.length - 1];
      setLastBlog(lastVisible);

      const blogs = docSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp,
          author: data.author,
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

      setBlogsData(blogs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Unable to load articles");
    }
  };

  const handleVote = async (blogId, action) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const blogIndex = blogsData.findIndex((blog) => blog.id === blogId);
      if (blogIndex === -1) return;

      const blog = blogsData[blogIndex];
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
          const userIds = Array.isArray(currentData.likes?.userIds) 
            ? currentData.likes.userIds.filter(id => id !== currentUser.uid)
            : [];
          updates.likes = {
            userIds,
            count: userIds.length
          };
        } else {
          const userIds = Array.isArray(currentData.dislikes?.userIds)
            ? currentData.dislikes.userIds.filter(id => id !== currentUser.uid)
            : [];
          updates.dislikes = {
            userIds,
            count: userIds.length
          };
        }

        // Update local state
        const updatedBlogs = [...blogsData];
        updatedBlogs[blogIndex] = {
          ...blog,
          [`${action}Count`]: updates[action === 'like' ? 'likes' : 'dislikes'].count,
          userAction: null,
        };
        setBlogsData(updatedBlogs);
      } else {
        // User is voting or changing vote
        if (action === 'like') {
          const userIds = Array.isArray(currentData.likes?.userIds)
            ? [...new Set([...currentData.likes.userIds, currentUser.uid])]
            : [currentUser.uid];
          updates.likes = {
            userIds,
            count: userIds.length
          };
          
          // If user had previously disliked, remove dislike
          if (blog.userAction === 'dislike') {
            const dislikeUserIds = Array.isArray(currentData.dislikes?.userIds)
              ? currentData.dislikes.userIds.filter(id => id !== currentUser.uid)
              : [];
            updates.dislikes = {
              userIds: dislikeUserIds,
              count: dislikeUserIds.length
            };
          }
        } else {
          const userIds = Array.isArray(currentData.dislikes?.userIds)
            ? [...new Set([...currentData.dislikes.userIds, currentUser.uid])]
            : [currentUser.uid];
          updates.dislikes = {
            userIds,
            count: userIds.length
          };
          
          // If user had previously liked, remove like
          if (blog.userAction === 'like') {
            const likeUserIds = Array.isArray(currentData.likes?.userIds)
              ? currentData.likes.userIds.filter(id => id !== currentUser.uid)
              : [];
            updates.likes = {
              userIds: likeUserIds,
              count: likeUserIds.length
            };
          }
        }

        // Update local state
        const updatedBlogs = [...blogsData];
        updatedBlogs[blogIndex] = {
          ...blog,
          likeCount: updates.likes?.count ?? blog.likeCount,
          dislikeCount: updates.dislikes?.count ?? blog.dislikeCount,
          userAction: action,
        };
        setBlogsData(updatedBlogs);
      }

      await updateDoc(blogRef, updates);
    } catch (error) {
      console.error("Error updating vote:", error);
      toast.error("Failed to update vote");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentUser]);

  const fetchMoreBlogs = async () => {
    if (infiniteLoading) return;

    try {
      setInfiniteLoading(true);
      const blogRef = collection(db, "blogs");
      const q = query(
        blogRef,
        orderBy("timestamp", "desc"),
        startAfter(lastBlog),
        limit(6)
      );
      const docSnap = await getDocs(q);
      const lastVisible = docSnap.docs[docSnap.docs.length - 1];
      setLastBlog(lastVisible);

      const blogs = docSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp,
          author: data.author,
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

      if (blogs.length === 0) {
        setHasMore(false);
      }

      setBlogsData((prevBlogs) => [...prevBlogs, ...blogs]);
      setInfiniteLoading(false);
    } catch (error) {
      console.error("Error fetching more blogs:", error);
      toast.error("Unable to load more articles");
      setInfiniteLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-7xl'>
      {/* Search */}
      <div className='my-12'>
        <Search />
      </div>

      {/* Categories */}
      <Tags />

      {/* Articles */}
      {loading ? (
        <div className='mx-auto mt-12 grid w-[95%] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : blogsData.length > 0 ? (
        <InfiniteScroll
          dataLength={blogsData.length}
          next={fetchMoreBlogs}
          hasMore={hasMore}
          className='mx-auto mt-12 grid w-[95%] grid-cols-1 gap-5 text-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
          loader={
            <div className='loader flex h-24 w-24 justify-center rounded-full border-8 border-t-8 border-gray-200 ease-linear'></div>
          }
        >
          {blogsData.map((blog) => (
            <Card
              key={blog.id}
              id={blog.id}
              blog={blog}
              likeCount={blog.likeCount}
              dislikeCount={blog.dislikeCount}
              userAction={blog.userAction}
              onVote={handleVote}
            />
          ))}
        </InfiniteScroll>
      ) : (
        <p className='mt-24 text-center text-4xl font-extrabold'>
          No Article found
        </p>
      )}
    </div>
  );
};

export default Articles;

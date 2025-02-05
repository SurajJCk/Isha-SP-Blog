import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../config/firebase";
import Loader from "../components/Loader";
import { Balancer } from "react-wrap-balancer";
import parse from "html-react-parser";
import "react-quill/dist/quill.snow.css";
import CommentSection from "../components/commentsSection/CommentSection";
import { getAuth } from "firebase/auth";
import dayjs from "dayjs";
import LazyLoad from "../components/common/LazyLoad";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80'
      onClick={onClose}
    >
      <div className='relative'>
        <Zoom>
          <img
            src={imageUrl}
            alt='Modal Content'
            className='max-h-[90vh] max-w-[90vw] rounded-lg'
          />
        </Zoom>
        <button
          className='absolute right-3 top-3 text-white'
          onClick={onClose}
          title='Close'
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const SingleArticle = () => {
  const [blogData, setBlogData] = useState();
  const [loading, setLoading] = useState(true);
  const [userAction, setUserAction] = useState(null);
  const params = useParams();
  const { categoryName, articleId } = params;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blogRef = doc(db, "blogs", articleId);
        const docSnap = await getDoc(blogRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBlogData({
            id: docSnap.id,
            data: {
              title: data.title,
              content: data.content,
              category: data.category,
              imageUrl: data.imageUrl,
              timestamp: data.timestamp,
              author: data.author,
              likes: data.likes || { count: 0, userIds: [] },
              dislikes: data.dislikes || { count: 0, userIds: [] },
              comments: data.comments || []
            }
          });
          
          // Set initial user action
          if (currentUser) {
            if (data.likes?.userIds?.includes(currentUser.uid)) {
              setUserAction('like');
            } else if (data.dislikes?.userIds?.includes(currentUser.uid)) {
              setUserAction('dislike');
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blog:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [articleId, currentUser]);

  const handleVote = async (action) => {
    if (!currentUser) {
      alert("Please sign in to vote");
      return;
    }

    try {
      const blogRef = doc(db, "blogs", articleId);
      const blogDoc = await getDoc(blogRef);
      if (!blogDoc.exists()) {
        alert("Blog not found");
        return;
      }

      const currentData = blogDoc.data();
      let updates = {};

      if (userAction === action) {
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
        setUserAction(null);
      } else {
        // User is voting or changing vote
        if (action === "like") {
          updates = {
            likes: {
              count: (currentData.likes?.count || 0) + 1,
              userIds: [...(currentData.likes?.userIds || []), currentUser.uid],
            },
          };
          if (userAction === "dislike") {
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
          if (userAction === "like") {
            updates.likes = {
              count: (currentData.likes?.count || 1) - 1,
              userIds: (currentData.likes?.userIds || []).filter(
                (id) => id !== currentUser.uid
              ),
            };
          }
        }
        setUserAction(action);
      }

      await updateDoc(blogRef, updates);
      
      // Update local state
      setBlogData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          likes: updates.likes || prev.data.likes,
          dislikes: updates.dislikes || prev.data.dislikes
        }
      }));
    } catch (error) {
      console.error("Error updating vote:", error);
      alert("Failed to update vote");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: blogData?.data?.title || "",
      text: `Check out this article: ${blogData?.data?.title || ""}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formattedDate = dayjs(blogData?.data?.timestamp?.toDate()).format(
    "YYYY-MM-DD"
  );

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  if (loading) {
    return <Loader />;
  }

  const fallBackImage =
    "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg?w=900&t=st=1686204841~exp=1686205441~hmac=16586e1f1340a9b9a774cd9538d3a9fc9fcd78acf00fbe2405160352f137faa4";

  const avatar =
    "https://img.freepik.com/free-vector/mysterious-mafia-man-smoking-cigarette_52683-34828.jpg?w=900&t=st=1686289808~exp=1686290408~hmac=ddf129d05139e33a919318574cf3f69182bb731b65ebb03b265448b8aef9cf77";

  return (
    <div className='mx-auto max-w-6xl text-gray-400 prose-h1:text-indigo-500 prose-h2:py-2 prose-h2:text-2xl prose-h2:text-emerald-500 prose-h3:text-zinc-500 prose-p:font-mono prose-p:tracking-wide prose-a:text-blue-500 prose-a:underline prose-li:list-disc prose-li:font-mono'>
      {blogData && (
        <>
          <div className='mx-auto mt-14 w-[90%] lg:w-[60%]'>
            <LazyLoad
              classes={"rounded-lg cursor-pointer"}
              image={blogData?.data?.imageUrl || fallBackImage}
              onClick={() =>
                handleImageClick(blogData?.data?.imageUrl || fallBackImage)
              }
            />
            <div className='mt-5 flex items-center justify-between'>
              <div className='flex items-center'>
                <img
                  className='mr-3 h-10 w-10 rounded-full'
                  src={avatar}
                  alt='Rounded avatar'
                />
                <p>
                  <i className='font-extralight text-gray-400'>written by ~ </i>
                  <strong>{blogData.data.author.name}</strong> on{" "}
                  <strong>{formattedDate}</strong>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote("like")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                      userAction === "like"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    👍 <span>{blogData.data.likes?.count || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote("dislike")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                      userAction === "dislike"
                        ? "bg-red-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    👎 <span>{blogData.data.dislikes?.count || 0}</span>
                  </button>
                </div>
                
                <button
                  onClick={handleShare}
                  className='p-2 transition-all hover:text-blue-500 active:scale-95'
                  title='Share article'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-6 w-6'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className='mx-4'>
            <p className='px-10 pt-10 text-white'>
              Tags:{" "}
              <span className='ml-3 rounded-xl bg-emerald-600 px-4 py-2 text-white'>
                {blogData.data.category}
              </span>
            </p>
            <h1 className='mx-auto mt-12 w-full text-center text-2xl font-extrabold md:w-[90%] md:text-4xl'>
              <Balancer>{blogData.data.title}</Balancer>
            </h1>
            <article className='space-y-3 hyphens-auto px-4 py-10 font-lexend leading-relaxed md:px-20'>
              <Balancer className='text-[18px] leading-7 md:text-[23px] md:leading-9 lg:leading-10'>
                {parse(blogData.data.content)}
              </Balancer>
            </article>
          </div>
        </>
      )}
      <div className='mx-auto mb-10 mt-3 w-[80%] lg:w-full lg:px-20'>
        <CommentSection blogId={articleId} />

        <div className='max-h-[30rem] space-y-4 overflow-y-scroll'>
          {blogData?.data?.comments &&
            blogData?.data?.comments?.map((comment, index) => {
              const formatDate = dayjs(comment.timestamp).format("DD-MM-YYYY");
              return (
                <div key={index} className='mt-6 rounded-md bg-zinc-800 p-2'>
                  <ul className='relative flex items-center pt-2'>
                    <img
                      className='mr-3 h-10 w-10 rounded-full'
                      src={`${comment.userImage ? comment.userImage : avatar}`}
                      alt='Rounded avatar'
                    />
                    <span className='pl-1'>
                      <strong>
                        {!comment.userName ? "Anonymous" : comment.userName}
                      </strong>
                      <span className='pl-2 text-zinc-600'>{formatDate}</span>
                    </span>
                    <span className='absolute right-3 cursor-pointer active:scale-95'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='h-8 w-8'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
                        />
                      </svg>
                    </span>
                  </ul>
                  <p className='ml-14 w-[80%] pt-2'>{comment.comment}</p>
                </div>
              );
            })}
        </div>
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={selectedImage}
      />
    </div>
  );
};

export default SingleArticle;

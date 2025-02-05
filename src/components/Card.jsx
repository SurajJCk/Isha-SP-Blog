import { auth } from "../config/firebase";
import parse from "html-react-parser";
import { useLocation, useNavigate } from "react-router-dom";
import LazyLoad from "./common/LazyLoad";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-hot-toast";

const Card = ({ id, blog, userAction, likeCount, dislikeCount, onVote, onDelete }) => {
  const location = useLocation();
  const navigate = useNavigate();
  dayjs.extend(relativeTime);

  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/category/${blog?.category}/${id}`;
    const shareData = {
      title: blog?.title || "",
      text: `Check out this article: ${blog?.title || ""}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const fallBackImage =
    "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg?w=900&t=st=1686204841~exp=1686205441~hmac=16586e1f1340a9b9a774cd9538d3a9fc9fcd78acf00fbe2405160352f137faa4";

  // Get data from blog object
  const title = blog?.title || "Untitled";
  const content = blog?.content || "";
  const category = blog?.category || "Uncategorized";
  const imageUrl = blog?.imageUrl || fallBackImage;
  const author = blog?.author || { name: "Anonymous" };
  const timestamp = blog?.timestamp;

  // Safely parse content or return empty string
  const parsedContent = content ? parse(content) : "";

  return (
    <div>
      <div
        onClick={() => navigate(`/category/${category}/${id}`)}
        className='google__btn__shadow relative mx-auto my-2 max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-white bg-gradient-to-r from-gray-700 via-gray-900 to-black shadow transition-all duration-200 ease-in-out hover:shadow-lg hover:shadow-sky-800 dark:border-gray-700 dark:bg-gray-800 cursor-pointer'
      >
        <div className='transition-all duration-300 ease-in-out'>
          <LazyLoad
            classes={
              "h-72 w-[30rem] rounded-t-lg object-cover transition-all duration-300 ease-in-out hover:scale-105"
            }
            image={imageUrl}
          />
        </div>
        <div className='h-56 p-5 font-bold tracking-tight'>
          <div className="flex flex-col gap-2 mb-2">
            <span className="self-start px-3 py-1 text-sm font-semibold rounded-full bg-blue-500 text-white capitalize">
              {category}
            </span>
            <h2 className='line-clamp-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
              {title}
            </h2>
          </div>
          <p className='mb-3 line-clamp-2 font-normal text-gray-700 dark:text-gray-400'>
            {parsedContent}
          </p>
          <div className='mt-6 flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(id, "like");
                }}
                className={`flex items-center ${
                  userAction === "like" ? "text-blue-500" : ""
                }`}
              >
                👍 <span className='ml-1'>{likeCount || 0}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(id, "dislike");
                }}
                className={`flex items-center ${
                  userAction === "dislike" ? "text-red-500" : ""
                }`}
              >
                👎 <span className='ml-1'>{dislikeCount || 0}</span>
              </button>
            </div>
            <button className='inline-flex items-center rounded-lg bg-blue-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'>
              Read more
              <svg
                aria-hidden='true'
                className='ml-2 -mr-1 h-4 w-4'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z'
                  clipRule='evenodd'
                ></path>
              </svg>
            </button>
          </div>
          <div className='mt-4 flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-500'>
                {author?.name || "Anonymous"}
              </span>
              <span className='text-sm text-gray-500'>•</span>
              <span className='text-sm text-gray-500'>
                {timestamp ? dayjs(timestamp.toDate()).fromNow() : ""}
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={handleShare}
                className='rounded-full p-2 hover:bg-gray-100'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-5 w-5'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z'
                  />
                </svg>
              </button>
              {author?.id === auth?.currentUser?.uid && (
                <button
                  onClick={handleDelete}
                  className='rounded-full p-2 hover:bg-gray-100'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 text-red-500'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;

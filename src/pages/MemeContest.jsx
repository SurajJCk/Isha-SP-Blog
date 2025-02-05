import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';
import { FaHeart, FaRegHeart, FaRegComment, FaRegBookmark, FaBookmark, FaEllipsisH } from 'react-icons/fa';
import { IoPaperPlaneOutline } from 'react-icons/io5';
import { BsImage } from 'react-icons/bs';
import { defaultAvatarUrl } from '../assets/default-avatar';

const MemeContest = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingMeme, setUploadingMeme] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [savedMemes, setSavedMemes] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState({});
  const [editingMeme, setEditingMeme] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    fetchMemes();
    // Load saved memes from localStorage
    const saved = JSON.parse(localStorage.getItem('savedMemes') || '[]');
    setSavedMemes(saved);
  }, []);

  const fetchMemes = async () => {
    setLoading(true);
    try {
      const memesRef = collection(db, 'memes');
      const q = query(memesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const memesData = [];
      for (const doc of querySnapshot.docs) {
        const meme = { id: doc.id, ...doc.data() };
        
        // Handle system user or missing user data
        if (meme.userId === 'system') {
          memesData.push({
            ...meme,
            username: 'Mindful Bot',
            userAvatar: defaultAvatarUrl,
            comments: meme.comments || []
          });
        } else {
          try {
            const userRef = doc(db, 'users', meme.userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              memesData.push({
                ...meme,
                username: userData.username || 'Anonymous',
                userAvatar: userData.photoURL || defaultAvatarUrl,
                comments: meme.comments || []
              });
            } else {
              memesData.push({
                ...meme,
                username: 'Anonymous',
                userAvatar: defaultAvatarUrl,
                comments: meme.comments || []
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            memesData.push({
              ...meme,
              username: 'Anonymous',
              userAvatar: defaultAvatarUrl,
              comments: meme.comments || []
            });
          }
        }
      }
      
      console.log('Fetched memes:', memesData); // Debug log
      setMemes(memesData);
    } catch (error) {
      console.error('Error fetching memes:', error);
      toast.error('Failed to load memes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error('Please sign in to share memes');
      return;
    }

    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    setUploadingMeme(true);
    try {
      const imageRef = ref(storage, `memes/${Date.now()}-${selectedImage.name}`);
      await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(imageRef);

      const memeData = {
        imageUrl,
        caption,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        likes: [],
        likeCount: 0,
        comments: []
      };

      await addDoc(collection(db, 'memes'), memeData);
      toast.success('Meme shared successfully!');
      setSelectedImage(null);
      setCaption('');
      setShowUploadModal(false);
      fetchMemes();
    } catch (error) {
      console.error('Error uploading meme:', error);
      toast.error('Failed to share meme');
    } finally {
      setUploadingMeme(false);
    }
  };

  const handleSave = (memeId) => {
    const newSavedMemes = savedMemes.includes(memeId)
      ? savedMemes.filter(id => id !== memeId)
      : [...savedMemes, memeId];
    
    setSavedMemes(newSavedMemes);
    localStorage.setItem('savedMemes', JSON.stringify(newSavedMemes));
    toast.success(savedMemes.includes(memeId) ? 'Removed from saved' : 'Saved to collection');
  };

  const handleLike = async (memeId) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to like memes');
      return;
    }

    try {
      const memeRef = doc(db, 'memes', memeId);
      const memeDoc = await getDoc(memeRef);
      const memeData = memeDoc.data();
      const userId = auth.currentUser.uid;

      let newLikes = [...(memeData.likes || [])];
      let newLikeCount = memeData.likeCount || 0;

      if (newLikes.includes(userId)) {
        newLikes = newLikes.filter(id => id !== userId);
        newLikeCount--;
      } else {
        newLikes.push(userId);
        newLikeCount++;
      }

      await updateDoc(memeRef, {
        likes: newLikes,
        likeCount: newLikeCount
      });

      setMemes(memes.map(meme => 
        meme.id === memeId 
          ? { ...meme, likes: newLikes, likeCount: newLikeCount }
          : meme
      ));
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = async (memeId) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      const memeRef = doc(db, 'memes', memeId);
      const memeDoc = await getDoc(memeRef);
      const memeData = memeDoc.data();

      const comment = {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Anonymous',
        userAvatar: auth.currentUser.photoURL || defaultAvatarUrl,
        timestamp: serverTimestamp()
      };

      const updatedComments = [...(memeData.comments || []), comment];

      await updateDoc(memeRef, {
        comments: updatedComments
      });

      setMemes(memes.map(meme => 
        meme.id === memeId 
          ? { ...meme, comments: updatedComments }
          : meme
      ));

      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleEdit = (meme) => {
    setEditingMeme(meme);
    setEditCaption(meme.caption);
    setShowEditModal(true);
  };

  const handleDelete = async (memeId) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to delete memes');
      return;
    }

    const meme = memes.find(m => m.id === memeId);
    if (meme.userId !== auth.currentUser.uid) {
      toast.error('You can only delete your own memes');
      return;
    }

    if (window.confirm('Are you sure you want to delete this meme?')) {
      try {
        await deleteDoc(doc(db, 'memes', memeId));
        setMemes(memes.filter(m => m.id !== memeId));
        toast.success('Meme deleted successfully');
      } catch (error) {
        console.error('Error deleting meme:', error);
        toast.error('Failed to delete meme');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!auth.currentUser) {
      toast.error('Please sign in to edit memes');
      return;
    }

    if (editingMeme.userId !== auth.currentUser.uid) {
      toast.error('You can only edit your own memes');
      return;
    }

    try {
      const memeRef = doc(db, 'memes', editingMeme.id);
      await updateDoc(memeRef, {
        caption: editCaption,
        lastEdited: serverTimestamp()
      });

      setMemes(memes.map(meme => 
        meme.id === editingMeme.id 
          ? { ...meme, caption: editCaption, lastEdited: new Date() }
          : meme
      ));

      setShowEditModal(false);
      setEditingMeme(null);
      setEditCaption('');
      toast.success('Meme updated successfully');
    } catch (error) {
      console.error('Error updating meme:', error);
      toast.error('Failed to update meme');
    }
  };

  const addInitialMemes = async () => {
    const initialMemes = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        caption: 'When you finally find inner peace through meditation 🧘‍♂️✨',
        userId: 'system',
        likes: [],
        likeCount: 0,
        comments: [],
        timestamp: serverTimestamp()
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        caption: 'That moment when your mind becomes still during yoga 🌟',
        userId: 'system',
        likes: [],
        likeCount: 0,
        comments: [],
        timestamp: serverTimestamp()
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        caption: 'When someone asks why you wake up at 4 AM for meditation 😌',
        userId: 'system',
        likes: [],
        likeCount: 0,
        comments: [],
        timestamp: serverTimestamp()
      }
    ];

    try {
      const memesRef = collection(db, 'memes');
      const addedMemes = [];
      
      for (const meme of initialMemes) {
        const docRef = await addDoc(memesRef, meme);
        addedMemes.push(docRef.id);
      }
      
      console.log('Added memes with IDs:', addedMemes); // Debug log
      toast.success('Added initial memes!');
      await fetchMemes();
    } catch (error) {
      console.error('Error adding initial memes:', error);
      toast.error('Failed to add initial memes');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Instagram-style header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">Mindful Memes</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Share Meme
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && memes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <BsImage className="text-6xl text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Memes Yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Be the first to share a mindful meme with the community!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Share Your First Meme
              </button>
              <button
                onClick={addInitialMemes}
                className="block px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Add Sample Memes
              </button>
            </div>
          </div>
        )}

        {/* Meme feed */}
        {!loading && memes.length > 0 && (
          <div className="space-y-6 py-6">
            {memes.map((meme) => (
              <article key={meme.id} className="border-b border-gray-200 dark:border-gray-800">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={meme.userAvatar}
                      alt={meme.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-semibold dark:text-white">{meme.username}</span>
                  </div>
                  {auth.currentUser && meme.userId === auth.currentUser.uid && (
                    <div className="relative">
                      <button 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={() => setShowEditModal(true)}
                      >
                        <FaEllipsisH />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
                        <button
                          onClick={() => handleEdit(meme)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Edit Meme
                        </button>
                        <button
                          onClick={() => handleDelete(meme.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Delete Meme
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Image */}
                <div className="relative w-full" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div className="relative pt-[100%]">
                    <img
                      src={meme.imageUrl}
                      alt={meme.caption}
                      className="absolute inset-0 w-full h-full object-contain bg-gray-100"
                    />
                  </div>
                </div>

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(meme.id)}
                        className="text-2xl"
                      >
                        {meme.likes?.includes(auth.currentUser?.uid) ? (
                          <FaHeart className="text-red-500" />
                        ) : (
                          <FaRegHeart className="dark:text-white" />
                        )}
                      </button>
                      <button className="text-2xl dark:text-white">
                        <FaRegComment />
                      </button>
                      <button className="text-2xl dark:text-white">
                        <IoPaperPlaneOutline />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSave(meme.id)}
                      className="text-2xl dark:text-white"
                    >
                      {savedMemes.includes(meme.id) ? (
                        <FaBookmark />
                      ) : (
                        <FaRegBookmark />
                      )}
                    </button>
                  </div>

                  {/* Likes */}
                  <div className="mb-2">
                    <span className="font-semibold dark:text-white">
                      {meme.likeCount} likes
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="mb-2">
                    <span className="font-semibold dark:text-white mr-2">{meme.username}</span>
                    <span className="dark:text-gray-300">{meme.caption}</span>
                  </div>

                  {/* Comments Section */}
                  {showComments[meme.id] && meme.comments.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                      {meme.comments.map((comment, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-3">
                          <img
                            src={comment.userAvatar}
                            alt={comment.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <div>
                            <span className="font-semibold dark:text-white mr-2">
                              {comment.username}
                            </span>
                            <span className="dark:text-gray-300">{comment.text}</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {comment.timestamp?.toDate().toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments */}
                  {meme.comments.length > 0 && (
                    <button 
                      onClick={() => setShowComments(prev => ({
                        ...prev,
                        [meme.id]: !prev[meme.id]
                      }))}
                      className="px-4 text-gray-500 dark:text-gray-400 text-sm"
                    >
                      {showComments[meme.id] ? 'Hide' : 'View all'} {meme.comments.length} comments
                    </button>
                  )}

                  {/* Comment Input */}
                  <div className="flex items-center border-t border-gray-200 dark:border-gray-800 px-4 py-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent dark:text-white focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleComment(meme.id);
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleComment(meme.id)}
                      className="text-blue-500 font-semibold ml-2 disabled:text-gray-400"
                      disabled={!newComment.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {meme.timestamp?.toDate().toLocaleDateString()}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-white">Share a Mindful Meme</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                  Upload Meme
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  {selectedImage ? (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected meme"
                      className="max-h-64 mx-auto object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <BsImage className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="meme-upload"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a mindful caption..."
                  className="w-full p-2 border rounded mb-4"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingMeme}
                className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:bg-gray-400"
              >
                {uploadingMeme ? 'Sharing...' : 'Share'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMeme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Meme</h2>
              <div className="mb-4">
                <img
                  src={editingMeme.imageUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caption
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMeme(null);
                    setEditCaption('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemeContest;

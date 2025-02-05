import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';
import { FaHeart, FaShare, FaRegHeart } from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';

const MemeContest = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingMeme, setUploadingMeme] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const auth = getAuth();

  useEffect(() => {
    fetchMemes();
  }, []);

  const fetchMemes = async () => {
    try {
      const memesRef = collection(db, 'memes');
      const q = query(memesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const memesData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const meme = doc.data();
        const userDoc = await getDoc(doc(db, 'users', meme.userId));
        const userData = userDoc.data();
        
        return {
          id: doc.id,
          ...meme,
          username: userData?.username || 'Anonymous',
          userAvatar: userData?.photoURL || '/default-avatar.png'
        };
      }));
      
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
      // Upload image to Firebase Storage
      const imageRef = ref(storage, `memes/${Date.now()}-${selectedImage.name}`);
      await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(imageRef);

      // Add meme to Firestore
      const memeData = {
        imageUrl,
        caption,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        likes: [],
        likeCount: 0
      };

      await addDoc(collection(db, 'memes'), memeData);
      toast.success('Meme shared successfully!');
      setSelectedImage(null);
      setCaption('');
      fetchMemes();
    } catch (error) {
      console.error('Error uploading meme:', error);
      toast.error('Failed to share meme');
    } finally {
      setUploadingMeme(false);
    }
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

  const handleShare = async (memeId) => {
    try {
      const meme = memes.find(m => m.id === memeId);
      await navigator.clipboard.writeText(meme.imageUrl);
      toast.success('Meme URL copied to clipboard!');
    } catch (error) {
      console.error('Error sharing meme:', error);
      toast.error('Failed to share meme');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Mindful Meme Contest</h1>
          <p className="text-gray-400">Share spiritual memes and spread mindfulness with humor!</p>
        </div>

        {/* Meme Upload Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 mb-12">
          <div className="mb-6">
            <label className="block text-white mb-2">Upload Meme</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedImage ? (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected meme"
                      className="max-h-48 object-contain mb-4"
                    />
                  ) : (
                    <>
                      <BsImage className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-400">Click to upload a meme</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
              placeholder="Add a mindful caption..."
            />
          </div>

          <button
            type="submit"
            disabled={uploadingMeme}
            className="w-full bg-purple-600 text-white rounded-md px-4 py-3 hover:bg-purple-700 transition-colors disabled:bg-gray-600"
          >
            {uploadingMeme ? 'Sharing...' : 'Share Meme'}
          </button>
        </form>

        {/* Memes Grid */}
        {loading ? (
          <div className="text-center text-gray-400">Loading memes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {memes.map((meme) => (
              <div key={meme.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={meme.imageUrl}
                  alt={meme.caption}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <p className="text-white mb-4">{meme.caption}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={meme.userAvatar}
                        alt={meme.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-gray-400">{meme.username}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(meme.id)}
                        className="flex items-center space-x-1 text-gray-400 hover:text-pink-500"
                      >
                        {meme.likes?.includes(auth.currentUser?.uid) ? (
                          <FaHeart className="text-pink-500" />
                        ) : (
                          <FaRegHeart />
                        )}
                        <span>{meme.likeCount || 0}</span>
                      </button>
                      <button
                        onClick={() => handleShare(meme.id)}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <FaShare />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeContest;

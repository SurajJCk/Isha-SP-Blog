import React, { useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import useAuthStatus from '../hooks/useAuthStatus';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SadhanapadaProfile = () => {
  const { authenticated, loading: authLoading } = useAuthStatus();
  const auth = getAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    batch: '',
    year: new Date().getFullYear(),
    program: 'Sadhanapada',
    country: '',
    image: null,
    imageUrl: '',
  });

  const programOptions = ['Sadhanapada', 'Sadhanapada 2.0', 'Sadhanapada Advanced'];

  // Fetch existing profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!authenticated) return;
      
      try {
        setLoading(true);
        const profilesCollection = collection(db, 'sadhanapada_profiles');
        if (!profilesCollection) {
          throw new Error('Could not access the profiles collection');
        }

        const q = query(profilesCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log('No profiles found');
          setProfiles([]);
          return;
        }

        const profilesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched profiles:', profilesData.length);
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast.error(`Failed to load profiles: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated) {
      console.log('Fetching profiles...');
      fetchProfiles();
    }
  }, [authenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authenticated) {
      toast.error('Please sign in to submit your profile');
      return;
    }

    if (!formData.name || !formData.batch || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (formData.image) {
        try {
          const imageRef = ref(storage, `sadhanapada_profiles/${Date.now()}_${formData.image.name}`);
          const uploadResult = await uploadBytes(imageRef, formData.image);
          console.log('Image uploaded successfully:', uploadResult);
          imageUrl = await getDownloadURL(imageRef);
          console.log('Image URL obtained:', imageUrl);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          toast.error('Failed to upload image. Profile will be created without an image.');
        }
      }

      const profileData = {
        name: formData.name,
        batch: formData.batch,
        year: formData.year,
        program: formData.program,
        country: formData.country,
        imageUrl,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      console.log('Submitting profile data:', profileData);
      const docRef = await addDoc(collection(db, 'sadhanapada_profiles'), profileData);
      console.log('Profile document created with ID:', docRef.id);
      
      setFormData({
        name: '',
        batch: '',
        year: new Date().getFullYear(),
        program: 'Sadhanapada',
        country: '',
        image: null,
        imageUrl: '',
      });
      
      toast.success('Profile submitted successfully!');
      
      // Refresh profiles
      const q = query(collection(db, 'sadhanapada_profiles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const updatedProfiles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched updated profiles:', updatedProfiles.length);
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error submitting profile:', error);
      toast.error(`Failed to submit profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Sadhanapada Community</h1>
          <p className="text-gray-400">Connect with fellow Sadhanapada participants</p>
        </div>

        {!authenticated ? (
          <div className="bg-gray-800 rounded-lg p-6 mb-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
            <p className="text-gray-400 mb-6">You need to be signed in to view and create profiles.</p>
            <button
              onClick={() => navigate('/sign-in')}
              className="bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg p-6 mb-12 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Share Your Profile</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Program</label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {programOptions.map(program => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Batch</label>
                    <input
                      type="text"
                      name="batch"
                      value={formData.batch}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Jan-Mar"
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-gray-300"
                    />
                    <p className="text-sm text-gray-400 mt-1">Max size: 5MB</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
              </form>
            </div>

            {loading ? (
              <div className="text-center text-white">Loading profiles...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                  <div key={profile.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-200">
                    {profile.imageUrl && (
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={profile.imageUrl}
                          alt={profile.name}
                          className="object-cover w-full h-48"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">{profile.name}</h3>
                      <p className="text-gray-400 mb-1">{profile.country}</p>
                      <p className="text-gray-400 mb-3">
                        {profile.program} | {profile.batch} {profile.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SadhanapadaProfile;

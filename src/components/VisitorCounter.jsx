import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { FaUsers } from 'react-icons/fa';

const VisitorCounter = () => {
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateVisitorCount = async () => {
      try {
        const visitorRef = doc(db, 'statistics', 'visitors');
        const visitorDoc = await getDoc(visitorRef);

        if (!visitorDoc.exists()) {
          // Initialize the visitor document if it doesn't exist
          await setDoc(visitorRef, {
            totalCount: 1,
            lastUpdated: new Date().toISOString()
          });
          setVisitorCount(1);
        } else {
          // Increment the visitor count
          await updateDoc(visitorRef, {
            totalCount: increment(1),
            lastUpdated: new Date().toISOString()
          });
          
          // Get the updated count
          const updatedDoc = await getDoc(visitorRef);
          setVisitorCount(updatedDoc.data().totalCount);
        }
      } catch (error) {
        console.error('Error updating visitor count:', error);
      } finally {
        setLoading(false);
      }
    };

    // Update visitor count when component mounts
    updateVisitorCount();
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="flex items-center gap-2 text-gray-200 bg-gray-800 px-3 py-1 rounded-full shadow-md">
      <FaUsers className="text-blue-400" />
      <span className="text-sm font-medium">
        {visitorCount.toLocaleString()} visitor{visitorCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default VisitorCounter;

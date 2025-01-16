import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Loader from "./Loader";

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        setIsAdmin(userDoc.data()?.isAdmin);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [auth.currentUser]);

  if (isAdmin === null) return <Loader />;

  return isAdmin ? <Outlet /> : <Navigate to='/' />;
};

export default AdminRoute;

import React from "react";
import { Link } from "react-router-dom";

const Tags = () => {
  const styles = {
    categoryBtn:
      "text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-300 font-medium rounded-full text-xs md:text-sm px-5 py-2 md:py-2.5 text-center mr-2 mb-2 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:focus:ring-emerald-800",
  };
  return (
    <ul className='mx-4 mt-6 flex items-center overflow-x-scroll pl-4 capitalize text-white md:mx-0  md:flex-wrap md:overflow-auto lg:justify-center lg:pl-0'>
      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/seva"}>Seva</Link>{" "}
      </li>

      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/dhyanalinga"}>Dhyanalinga</Link>{" "}
      </li>

      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/linga bhairavi"}>Linga Bhairavi</Link>{" "}
      </li>

      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/spiritual Growth"}>spiritual Growth</Link>{" "}
      </li>
      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/program experience"}>program experience</Link>{" "}
      </li>
      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/yoga"}>Yoga</Link>{" "}
      </li>
      <li className={`${styles.categoryBtn}`}>
        <Link to={"/category/sadhana"}>Sadhana</Link>{" "}
      </li>
    </ul>
  );
};

export default Tags;

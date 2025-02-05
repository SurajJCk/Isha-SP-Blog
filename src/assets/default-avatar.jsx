import React from 'react';

const DefaultAvatar = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20" cy="20" r="20" fill="#E2E8F0"/>
    <path
      d="M20 10C17.7909 10 16 11.7909 16 14C16 16.2091 17.7909 18 20 18C22.2091 18 24 16.2091 24 14C24 11.7909 22.2091 10 20 10Z"
      fill="#94A3B8"
    />
    <path
      d="M28 26C28 29.3137 24.4183 32 20 32C15.5817 32 12 29.3137 12 26C12 22.6863 15.5817 20 20 20C24.4183 20 28 22.6863 28 26Z"
      fill="#94A3B8"
    />
  </svg>
);

export const defaultAvatarUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#E2E8F0"/><path d="M20 10C17.7909 10 16 11.7909 16 14C16 16.2091 17.7909 18 20 18C22.2091 18 24 16.2091 24 14C24 11.7909 22.2091 10 20 10Z" fill="#94A3B8"/><path d="M28 26C28 29.3137 24.4183 32 20 32C15.5817 32 12 29.3137 12 26C12 22.6863 15.5817 20 20 20C24.4183 20 28 22.6863 28 26Z" fill="#94A3B8"/></svg>'
)}`;

export default DefaultAvatar;

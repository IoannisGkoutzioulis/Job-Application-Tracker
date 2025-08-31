// src/utils/helpers.js
export const getStatusClassName = (status) => {
    return status.replace(/\s+/g, '-').toLowerCase();
  };
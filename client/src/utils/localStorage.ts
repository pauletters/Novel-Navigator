const getUserKey = () => {
  // Get user token and decode it to get user ID
  const token = localStorage.getItem('id_token');
  if (!token) return '';
  
  try {
    // Decode the token to get user info
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.data._id || '';
  } catch (e) {
    console.error('Error decoding token:', e);
    return '';
  }
};

// Save and remove book ids from local storage for the logged in user
export const getSavedBookIds = () => {
  const userId = getUserKey();
  if (!userId) return [];

  const key = `saved_books_${userId}`;
  const savedBookIds = localStorage.getItem(key)
    ? JSON.parse(localStorage.getItem(key)!)
    : [];

  return savedBookIds;
};

export const saveBookIds = (bookIdArr: string[]) => {
  const userId = getUserKey();
  if (!userId) return;

  const key = `saved_books_${userId}`;
  if (bookIdArr.length) {
    localStorage.setItem(key, JSON.stringify(bookIdArr));
  } else {
    localStorage.removeItem(key);
  }
};

export const removeBookId = (bookId: string) => {
  const userId = getUserKey();
  if (!userId) return false;

  const key = `saved_books_${userId}`;
  const savedBookIds = localStorage.getItem(key)
    ? JSON.parse(localStorage.getItem(key)!)
    : null;

  if (!savedBookIds) {
    return false;
  }

  const updatedSavedBookIds = savedBookIds?.filter((savedBookId: string) => savedBookId !== bookId);
  localStorage.setItem(key, JSON.stringify(updatedSavedBookIds));

  return true;
};

// Cleanup function to clear saved books when logging out
export const clearSavedBooks = () => {
  const userId = getUserKey();
  if (userId) {
    localStorage.removeItem(`saved_books_${userId}`);
  }
};
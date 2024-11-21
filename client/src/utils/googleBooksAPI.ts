interface searchParams {
  query: string;
  maxResults?: number;
  startIndex?: number;
}

// make a search to google books api
// https://www.googleapis.com/books/v1/volumes?q=harry+potter
export const searchGoogleBooks = ({ 
  query, 
  maxResults = 30,
  startIndex = 0 
}: searchParams) => {
  return fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults}&startIndex=${startIndex}`);
};

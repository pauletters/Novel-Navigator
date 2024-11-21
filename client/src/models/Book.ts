import { GoogleAPIBook } from './GoogleAPIBook';

export interface Book {
  authors: string[],
  description: string;
  bookId: string;
  image?: string;
  link?: string;
  title: string;
}

// Filters out books that don't have a thumbnail, description, title, or author
export const filterBooks = (books: GoogleAPIBook[]) => {
  let filtered = books.filter(book => (
    book.volumeInfo.imageLinks?.thumbnail &&
    book.volumeInfo.description &&
    book.volumeInfo.description.length > 50 &&
    book.volumeInfo.title &&
    book.volumeInfo.authors?.length > 0
  ));

  // If we don't have enough books after strict filtering,
  // do a more lenient filtering
  if (filtered.length < 30) {
    filtered = books.filter(book => (
      // Just require title and either image or description
      book.volumeInfo.title &&
      (book.volumeInfo.imageLinks?.thumbnail ||
       book.volumeInfo.description)
    ));
  }

  return filtered;
};

export const mapBookData = (book: GoogleAPIBook): Book => ({
  bookId: book.id,
  authors: book.volumeInfo.authors || ['No author to display'],
  title: book.volumeInfo.title,
  description: book.volumeInfo.description,
  image: book.volumeInfo.imageLinks.thumbnail,
  link: book.volumeInfo.previewLink || book.volumeInfo.canonicalVolumeLink || ''
});
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Row,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import BookDetailsModal from '../components/BookDetailsModal';
import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { Book, filterBooks, mapBookData } from '../models/Book';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../utils/mutations';
import PaginationButtons from '../components/PaginationButtons';
import FilteredBooksList from '../components/FilteredBooksList';

const SearchBooks = () => {

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 30;
  const FETCH_AMOUNT = 40; // Fetching more than 30 to account for filtering
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  // Modal handlers
  const handleShowModal = (book: Book) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    setShowModal(false);
  };

  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    console.log('Current savedBookIds:', savedBookIds);
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchInput) {
      return;
    }

    try {
      setCurrentSearchTerm(searchInput);
      const response = await searchGoogleBooks({
        query: searchInput,
        maxResults: FETCH_AMOUNT,
        startIndex: 0
      });

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const { items, totalItems } = await response.json();

      if (!items) {
        setSearchedBooks([]);
        setTotalItems(0);
        return;
      }

      const filteredBooks = filterBooks(items);
      const bookData = filteredBooks
      .map(mapBookData)
      .slice(0, ITEMS_PER_PAGE);

      setSearchedBooks(bookData);
      setTotalItems(totalItems);
      setCurrentPage(1);
      setSearchInput('');
    } catch (err) {
      console.error('Error searching books:', err);
    }
  };

  const handlePageChange = async (pageNumber: number) => {
    try {
      if (!currentSearchTerm) {
        return;
      }
  
      const response = await searchGoogleBooks({
        query: currentSearchTerm,
        maxResults: FETCH_AMOUNT,
        startIndex: (pageNumber - 1) * ITEMS_PER_PAGE
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
  
      const { items } = await response.json();
  
      if (!items || items.length === 0) {
        console.log('No more results found');
        return;
      }
  
      const filteredBooks = filterBooks(items);
      const bookData = filteredBooks
      .map(mapBookData)
      .slice(0, ITEMS_PER_PAGE);
  
      setSearchedBooks(bookData);
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error fetching page:', err);
    }
  };

  // create function to handle saving a book to our database
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [saveBook, { loading: saveLoading }] = useMutation(SAVE_BOOK, {
    onCompleted: (data) => {
      if (data.saveBook) {
      // Updates savedBookIds with the newly saved book
      const savedBookId = data.saveBook.savedBooks[data.saveBook.savedBooks.length - 1].bookId;
      // Update local state
      setSavedBookIds((prevIds: string[]) => {
        const newIds = [...prevIds, savedBookId];
        // Update localStorage
        saveBookIds(newIds);
        return newIds;
      });
      setToastMessage('Book saved successfully!');
      setShowToast(true);
    }
  },
    onError: (err) => {
      setToastMessage('Failed to save book. Please try again.');
      setShowToast(true);
      console.error('Error saving book:', err);
    }
  });

  // Loads saved book IDs on component mount
  useEffect(() => {
    const savedIds = getSavedBookIds();
    setSavedBookIds(savedIds);
  }, []);

  // Saves to localStorage whenever savedBookIds changes
  useEffect(() => {
    saveBookIds(savedBookIds);
  }, [savedBookIds]);

  const handleSaveBook = async (bookId: string) => {

    // Check login status first
    if (!Auth.loggedIn()) {
      setToastMessage('You must be logged in to save a book!');
      setShowToast(true);
      return;
    }

    // Checks if the book is already saved
    const alreadySaved = savedBookIds.includes(bookId);
    if (alreadySaved) {
      setToastMessage('This book is already in your library!');
      setShowToast(true);
      return;
    }

    // finds the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

    if (!bookToSave) {
      setToastMessage('Error finding book details.');
      setShowToast(true);
      return;
    }

    try {
      await saveBook({
        variables: { 
          input: {
            bookId: bookToSave.bookId,
            authors: bookToSave.authors,
            title: bookToSave.title,
            description: bookToSave.description,
            image: bookToSave.image,
            link: bookToSave.link
          }
        }
      });
      } catch (err) {
        console.error('Error saving book:', err);
        setToastMessage('Failed to save book. Please try again.');
        setShowToast(true);
      }
    };

      

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>N🧭VEL NAVIGATOR</h1>
          <h4>Your compass for literary discovery</h4>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg' className='submit-button'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results out of ${totalItems}:`
            : 'Search for a book to begin'}
        </h2>

        <FilteredBooksList
          books={searchedBooks}
          savedBookIds={savedBookIds}
          saveLoading={saveLoading}
          onSaveBook={handleSaveBook}
          onShowModal={handleShowModal}
          isAuthenticated={Auth.loggedIn()}
        />
        
        {searchedBooks.length > 0 && (
          <PaginationButtons
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        )}

      </Container>

      <BookDetailsModal
        book={selectedBook}
        show={showModal}
        onHide={handleCloseModal}
      />

<ToastContainer 
        position="bottom-end" 
        className="p-3" 
        style={{ zIndex: 1056 }}
      >
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          bg="success"
          className="text-white"
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">Novel Navigator</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default SearchBooks;

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import BookDetailsModal from '../components/BookDetailsModal';
import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../utils/mutations';

const SearchBooks = () => {

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const { items } = await response.json();

      const bookData = items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description || 'No description available',
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.previewLink || book.volumeInfo.canonicalVolumeLink ||''
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error('Error searching books:', err);
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
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row className='g-4'>
          {searchedBooks.map((book) => {
            const isBookSaved = savedBookIds.includes(book.bookId);
            console.log(`Book ${book.bookId} saved status:`, isBookSaved);
            return (
              <Col md="4" key={book.bookId}>
                <Card 
                className='h-100 d-flex flex-column hover-shadow' border='dark'
                 onClick={() => handleShowModal(book)} 
                 style={{ cursor: 'pointer' }}>
                  {book.image ? (
                    <div style={{ height: '300px', overflow: 'hidden' }}>
                    <Card.Img 
                      src={book.image} 
                      alt={`The cover for ${book.title}`} 
                      variant='top'
                      style={{ 
                        objectFit: 'cover',
                        height: '100%',
                        width: '100%'
                      }} 
                    />
                  </div>
                ) : null}
                  <Card.Body className='d-flex flex-column'>
                    <Card.Title className='flex-grow-0'>{book.title}</Card.Title>
                    <p className='small flex-grow-0'>Authors: {book.authors}</p>
                    <Card.Text className='flex-grow-1' style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {book.description}
                      </Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={isBookSaved || saveLoading}
                        className={`mt-auto w-100 ${isBookSaved ? 'btn-secondary' : 'btn-info'}`}
                        onClick={(e) => {
                        e.stopPropagation(); // Prevents modal from opening
                        if (!isBookSaved && !saveLoading) {
                        handleSaveBook(book.bookId)}
                        }}>
                        {isBookSaved ? ('📚 Added to Library') : saveLoading ? ('Saving...') : ('📖 Save this Book!')}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
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

import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { Book } from '../models/Book.js';
import { useState } from 'react';
import BookDetailsModal from '../components/BookDetailsModal';

// Displays the user's saved books
 const SavedBooks = () => { 
   const [selectedBook, setSelectedBook] = useState<Book | null>(null);
   const [showModal, setShowModal] = useState(false);

  //  create state to hold saved book data
   const handleShowModal = (book: Book) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  // create state to hold modal display
  const handleCloseModal = () => {
    setSelectedBook(null);
    setShowModal(false);
  };

   const { loading, error, data } = useQuery(GET_ME);
   const [removeBook] = useMutation(REMOVE_BOOK, {
     update(cache, { data: { removeBook } }) {
    try {
      cache.writeQuery({
        query: GET_ME,
        data: { me: removeBook },
      });
    }
    catch (e) {
      console.error('Error updating cache:', e);
    }  
    },
    onError: (e) => {
      console.error('Error removing book:', e);
    }
    });

  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteBook = async (bookId: string) => {
    if (!Auth.loggedIn()) {
      return;
    }

    try {
      const { data } = await removeBook({
        variables: { bookId },
      });

      if (data?.removeBook) {
        // upon success, remove book's id from localStorage
        removeBookId(bookId);
      }
    } catch (err) {
      console.error('Error removing book:', err);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return <h2>Error loading saved books!</h2>;
  }

  const userData = data?.me || {};


  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
        <h1 className='SB-h1'>N🧭VEL NAVIGATOR</h1>
          <h4 className='SB-h4'>Your saved literary discoveries</h4>
          {userData.username && (
            <h2>{userData.username}'s Library</h2>
          )}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row className='g-4'>
          {userData.savedBooks.map((book: Book) => {
            return (
              <Col md='4'>
                <Card 
                className='h-100 d-flex flex-column hover-shadow' 
                key={book.bookId} border='dark' onClick={(
                ) => handleShowModal(book)} style={{ cursor: 'pointer' }}>
                  {book.image && (
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
                )}
                  <Card.Body className='d-flex flex-column'>
                    <Card.Title className='flex-grow-0'>{book.title}</Card.Title>
                    <p className='small flex-grow-0'>Authors: {book.authors?.join(', ')}</p>
                    <Card.Text className='flex-grow-1'
                    style={{ 
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}
                    >
                      {book.description}</Card.Text>
                    <Button
                      className='mt-auto w-100 btn-danger'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents modal from opening
                        handleDeleteBook(book.bookId);
                      }}
                    >
                      Delete from Library
                    </Button>
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

    </>
  );
};

export default SavedBooks;

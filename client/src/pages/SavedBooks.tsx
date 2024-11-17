import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { Book } from '../models/Book.js';

 const SavedBooks = () => { 
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
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
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
        <Row>
          {userData.savedBooks.map((book: Book) => {
            return (
              <Col md='4'>
                <Card key={book.bookId} border='dark'>
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant='top'
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className='btn-block btn-danger'
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;

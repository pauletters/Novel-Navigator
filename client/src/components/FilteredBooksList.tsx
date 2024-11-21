import { Row, Col, Card, Button } from 'react-bootstrap';
import type { Book } from '../models/Book';

interface FilteredBooksListProps {
  books: Book[];
  savedBookIds: string[];
  saveLoading: boolean;
  onSaveBook: (bookId: string) => void;
  onShowModal: (book: Book) => void;
  isAuthenticated: boolean;
}

// Filters the books list and displays the books in a grid layout
const FilteredBooksList = ({
  books,
  savedBookIds,
  saveLoading,
  onSaveBook,
  onShowModal,
  isAuthenticated
}: FilteredBooksListProps) => {
  return (
    <Row className='g-4'>
      {books.map((book) => {
        const isBookSaved = savedBookIds.includes(book.bookId);
        return (
          <Col md="4" key={book.bookId}>
            <Card 
              className='h-100 d-flex flex-column hover-shadow' 
              border='dark'
              onClick={() => onShowModal(book)} 
              style={{ cursor: 'pointer' }}
            >
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
                <p className='small flex-grow-0'>Authors: {book.authors}</p>
                <Card.Text 
                  className='flex-grow-1' 
                  style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {book.description}
                </Card.Text>
                {isAuthenticated && (
                  <Button
                    disabled={isBookSaved || saveLoading}
                    className={`mt-auto w-100 ${isBookSaved ? 'btn-secondary' : 'btn-info'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBookSaved && !saveLoading) {
                        onSaveBook(book.bookId);
                      }
                    }}
                  >
                    {isBookSaved 
                      ? '📚 Added to Library' 
                      : saveLoading 
                      ? 'Saving...' 
                      : '📖 Save this Book!'}
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default FilteredBooksList;
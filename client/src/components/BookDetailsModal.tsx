import { Modal, Button } from 'react-bootstrap';
import type { Book } from '../models/Book';

interface BookModalProps {
  book: Book | null;
  show: boolean;
  onHide: () => void;
}

const BookDetailsModal = ({ book, show, onHide }: BookModalProps) => {
  if (!book) return null;

   // Function to format description into paragraphs
const formatDescription = (description: string) => {
    
     // List of common abbreviations and special cases to ignore
  const abbreviations = [
    'vs.',
    'Mr.',
    'Mrs.',
    'Ms.',
    'Dr.',
    'Prof.',
    'St.',
    'etc.',
    'e.g.',
    'i.e.',
    'Vol.',
    'Ch.',
    'p.',
    'pp.',
    'No.'
  ];

  // First, temporarily replace periods in abbreviations
  let tempText = description;
  abbreviations.forEach(abbr => {
    tempText = tempText.replace(
      new RegExp(abbr.replace('.', '\\.'), 'g'),
      abbr.replace('.', '___PERIOD___')
    );
  });

  // Splits into sentences
  const sentences = tempText
    .split(/(?<=[.!?])\s+/)
    .map(sentence => 
      sentence.replace(/___PERIOD___/g, '.').trim()
    )
    .filter(Boolean);

  // Groups into paragraphs
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence);

    // Create a new paragraph if:
    // 1. We have enough sentences OR
    // 2. The current content is long enough OR
    // 3. We detect a major topic change OR
    // 4. This is the last sentence
    const shouldBreak = 
      currentParagraph.length >= 7 ||
      currentParagraph.join(' ').length > 500 ||
      sentence.includes('Other books by') || // Special case for book lists
      index === sentences.length - 1;

    if (shouldBreak) {
      const paragraph = currentParagraph.join(' ').trim();
      if (paragraph) {
        paragraphs.push(paragraph);
      }
      currentParagraph = [];
    }
  });
      
      return paragraphs;
    };
  
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="book-modal"
      centered
      className="book-detail-modal"
    >
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title id="book-modal" className="text-primary">
          {book.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-3">
        <div className="text-center mb-4">
          {book.image && (
            <img
              src={book.image}
              alt={`The cover for ${book.title}`}
              className="modal-book-image"
              style={{ 
                maxHeight: '400px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px'
             }}
            />
          )}
        </div>
        <h4 className="text-secondary mb-3">Authors: {book.authors?.join(', ')}</h4>
        <div className="description-container">
            {formatDescription(book.description).map((paragraph, index) => (
            <p
            key={index}
            className="description-paragraph"
            style={{
                marginBottom: '1rem',
                lineHeight: '1.8',
                textAlign: 'justify',
                textIndent: '2em',
                fontSize: '1.1rem'
              }}
            >
            {paragraph}
            </p>
            ))}
        </div>
        {book.link && (
            <div className="text-center mt-4">
          <Button 
            variant="info" 
            href={book.link} 
            target="_blank" 
            className="px-4 py-2"
          >
            View on Google Books
          </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default BookDetailsModal;
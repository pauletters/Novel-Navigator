import { Pagination } from 'react-bootstrap';

interface PaginationButtonsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (pageNumber: number) => void;
}

const PaginationButtons = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage,
  onPageChange 
}: PaginationButtonsProps) => {
  const totalPages = Math.min(Math.ceil(totalItems / itemsPerPage), 10);
  const items = [];

  items.push(
    <Pagination.Prev
      key="prev"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
    />
  );

  for (let number = 1; number <= totalPages; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => onPageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  items.push(
    <Pagination.Next
      key="next"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    />
  );

  return <Pagination className="justify-content-center mt-4">{items}</Pagination>;
};

export default PaginationButtons;
import React, { useState, useMemo } from 'react';
import { Table, Form, Row, Col, Button, Pagination } from 'react-bootstrap';

export const DataTable = ({
    data = [],
    columns = [],
    pageSize = 10,
    searchable = true,
    sortable = true,
    className = "",
    striped = true,
    hover = true,
    bordered = false,
    responsive = true,
    // New refresh functionality props
    refreshable = false,
    onRefresh = null,
    refreshButtonText = "Làm mới dữ liệu",
    refreshButtonIcon = "bi bi-arrow-clockwise",
    refreshButtonVariant = "outline-primary",
    tableTitle = ""
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter(item =>
            columns.some(column => {
                const value = column.accessor ? item[column.accessor] : '';
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Calculate pagination info
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, sortedData.length);

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const getSortIcon = (columnKey) => {
        if (!sortable || sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // Generate pagination items
    const renderPaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />);
            }
        }

        // Visible pages
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />);
            }
            items.push(
                <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }

        return items;
    };

    return (
        <div className="datatable-container">
            {/* Search and Refresh Row */}
            <Row className="mb-3 align-items-center">
                <Col md={6}>
                    {searchable && (
                        <Form.Group>
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page when searching
                                }}
                            />
                        </Form.Group>
                    )}
                </Col>
                <Col md={6} className="text-end">
                    {refreshable && onRefresh && (
                        <Button
                            variant={refreshButtonVariant}
                            size="sm"
                            onClick={onRefresh}
                            title={refreshButtonText}
                        >
                            <i className={refreshButtonIcon}></i> {refreshButtonText}
                        </Button>
                    )}
                </Col>
            </Row>

            {/* Table */}
            <div className={responsive ? 'table-responsive' : ''} style={{ overflow: 'visible' }}>
                <Table
                    striped={striped}
                    hover={hover}
                    bordered={bordered}
                    className={`mb-0 ${className}`}
                    style={{ overflow: 'visible' }}
                >
                    <thead className="table-light">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={column.key || index}
                                    style={{
                                        cursor: sortable && column.sortable !== false ? 'pointer' : 'default',
                                        width: column.width || 'auto'
                                    }}
                                    onClick={() => column.sortable !== false && handleSort(column.accessor)}
                                    className={column.className || ''}
                                >
                                    {column.header}
                                    {getSortIcon(column.accessor)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <tr key={row.id || rowIndex} className="align-middle">
                                    {columns.map((column, colIndex) => (
                                        <td key={`${rowIndex}-${colIndex}`} className={column.cellClassName || ''}>
                                            {column.render
                                                ? column.render(row, rowIndex)
                                                : column.accessor
                                                    ? row[column.accessor]
                                                    : ''
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center text-muted py-4">
                                    <i className="bi bi-inbox display-4 d-block mb-2"></i>
                                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            
            {/* Total Records Count - Always show */}
            <Row className="mt-2">
                <Col className="text-center">
                    <small className="text-muted">
                        Hiển thị {startItem} đến {endItem} trong tổng số {sortedData.length} bản ghi
                    </small>
                </Col>
            </Row>

            {/* Pagination and Total Records */}
            {totalPages > 1 && (
                <Row className="mt-3 align-items-center">
                    <Col>
                        <Pagination className="justify-content-end mb-0">
                            <Pagination.Prev
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            />
                            {renderPaginationItems()}
                            <Pagination.Next
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            />
                        </Pagination>
                    </Col>
                </Row>
            )}
        </div>
    );
};

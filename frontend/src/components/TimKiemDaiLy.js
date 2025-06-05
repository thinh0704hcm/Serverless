import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col, Alert, Accordion } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";
import { useNavigate } from "react-router-dom";
import {
    getAllLoaiDaiLy, getAllQuan, searchDaiLy,
    getAllMatHang, getAllDonViTinh
} from "../services/api.js";
import { Quan, LoaiDaiLy } from "../models/index.js";
import { DataTable } from './DataTable';
import { MoneyInput } from './MoneyInput';
import { formatMoney } from '../utils/formatters';

export const TimKiemDaiLy = ({ isModal = false, onSelect = null, onClose = null }) => {
    const navigate = useNavigate();
    const [dsQuan, setDSQuan] = useState([]);
    const [dsLoaiDaiLy, setDSLoaiDaiLy] = useState([]);
    const [dsMatHang, setDSMatHang] = useState([]);
    const [dsDonViTinh, setDSDonViTinh] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    // Search state
    const [searchCriteria, setSearchCriteria] = useState({
        madaily: '',
        tendaily: '',
        sodienthoai: '',
        email: '',
        diachi: '',
        maquan: '',
        tenquan: '',
        maloaidaily: '',
        tenloaidaily: '',
        ngaytiepnhan_from: '',
        ngaytiepnhan_to: '',
        congno_min: '',
        congno_max: '',
        has_debt: '',
        // Advanced export slip criteria
        maphieuxuat_from: '',
        maphieuxuat_to: '',
        ngaylap_from: '',
        ngaylap_to: '',
        tonggiatri_from: '',
        tonggiatri_to: '',
        // Product/item criteria
        mamathang: '',
        soluongxuat_from: '',
        soluongxuat_to: '',
        dongiaxuat_from: '',
        dongiaxuat_to: '',
        thanhtien_from: '',
        thanhtien_to: '',
        soluongton_from: '',
        soluongton_to: '',
        madonvitinh: ''
    });

    // Raw values for money fields
    const [rawMoneyValues, setRawMoneyValues] = useState({
        congno_min: 0,
        congno_max: 0,
        tonggiatri_from: 0,
        tonggiatri_to: 0,
        dongiaxuat_from: 0,
        dongiaxuat_to: 0,
        thanhtien_from: 0,
        thanhtien_to: 0
    });

    const [searchResults, setSearchResults] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Add selection state for modal mode
    const [selectedAgent, setSelectedAgent] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setInfoMessage('Đang tải dữ liệu...');

                const [loaiDaiLyResponse, quanResponse, matHangResponse, donViTinhResponse] = await Promise.all([
                    getAllLoaiDaiLy(),
                    getAllQuan(),
                    getAllMatHang(),
                    getAllDonViTinh()
                ]);

                const loaiDaiLyList = Array.isArray(loaiDaiLyResponse) ?
                    loaiDaiLyResponse.map(ldl => new LoaiDaiLy(ldl.maloaidaily, ldl.tenloaidaily))
                        .sort((a, b) => {
                            const numA = parseInt(a.tenloaidaily.replace(/\D/g, ""));
                            const numB = parseInt(b.tenloaidaily.replace(/\D/g, ""));
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                            }
                            return a.tenloaidaily.localeCompare(b.tenloaidaily);
                        }) : [];

                const quanList = Array.isArray(quanResponse) ?
                    quanResponse
                        .map(q => new Quan(q.maquan, q.tenquan))
                        .sort((a, b) => {
                            const numA = parseInt(a.tenquan.replace(/\D/g, ""));
                            const numB = parseInt(b.tenquan.replace(/\D/g, ""));
                            if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                            }
                            return a.tenquan.localeCompare(b.tenquan);
                        }) : [];

                setDSLoaiDaiLy(loaiDaiLyList);
                setDSQuan(quanList);
                setDSMatHang(Array.isArray(matHangResponse) ? matHangResponse : []);
                setDSDonViTinh(Array.isArray(donViTinhResponse) ? donViTinhResponse : []);

            } catch (error) {
                console.error("Error loading data:", error);
                setErrorMessage("Không thể tải dữ liệu: " + error.message);
            } finally {
                setIsLoading(false);
                setInfoMessage('');
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (field, value) => {
        setSearchCriteria(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleMoneyInputChange = (field, formattedValue, rawValue) => {
        setSearchCriteria(prev => ({
            ...prev,
            [field]: formattedValue
        }));
        setRawMoneyValues(prev => ({
            ...prev,
            [field]: rawValue
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        setSearchPerformed(true);

        try {
            // Prepare criteria with raw money values
            const filteredCriteria = Object.entries(searchCriteria)
                .filter(([key, value]) => value !== '')
                .reduce((obj, [key, value]) => {
                    // Use raw values for money fields
                    if (rawMoneyValues.hasOwnProperty(key)) {
                        return { ...obj, [key]: rawMoneyValues[key] };
                    }
                    return { ...obj, [key]: value };
                }, {});

            console.log('Search criteria:', filteredCriteria);

            const results = await searchDaiLy(filteredCriteria);
            setSearchResults(Array.isArray(results) ? results : []);
        } catch (error) {
            console.error('Search error:', error);
            setErrorMessage('Lỗi khi tìm kiếm: ' + error.message);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchCriteria({
            madaily: '',
            tendaily: '',
            sodienthoai: '',
            email: '',
            diachi: '',
            maquan: '',
            tenquan: '',
            maloaidaily: '',
            tenloaidaily: '',
            ngaytiepnhan_from: '',
            ngaytiepnhan_to: '',
            congno_min: '',
            congno_max: '',
            has_debt: '',
            maphieuxuat_from: '',
            maphieuxuat_to: '',
            ngaylap_from: '',
            ngaylap_to: '',
            tonggiatri_from: '',
            tonggiatri_to: '',
            mamathang: '',
            soluongxuat_from: '',
            soluongxuat_to: '',
            dongiaxuat_from: '',
            dongiaxuat_to: '',
            thanhtien_from: '',
            thanhtien_to: '',
            soluongton_from: '',
            soluongton_to: '',
            madonvitinh: ''
        });
        setRawMoneyValues({
            congno_min: 0,
            congno_max: 0,
            tonggiatri_from: 0,
            tonggiatri_to: 0,
            dongiaxuat_from: 0,
            dongiaxuat_to: 0,
            thanhtien_from: 0,
            thanhtien_to: 0
        });
        setSearchResults([]);
        setErrorMessage('');
        setSearchPerformed(false);
    };

    const handleSelectAgent = (agent) => {
        if (isModal) {
            setSelectedAgent(agent);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedAgent && onSelect) {
            onSelect(selectedAgent);
        }
        if (onClose) {
            onClose();
        }
    };

    const handleExitToHome = () => {
        if (isModal && onClose) {
            onClose();
        } else {
            navigate("/");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Define columns for search results DataTable
    const searchColumns = [
        {
            header: isModal ? 'Chọn' : 'STT',
            accessor: isModal ? 'select' : 'stt',
            width: '2%',
            sortable: false,
            cellClassName: 'text-center',
            render: (row, index) => isModal ? (
                <Form.Check
                    type="radio"
                    name="selectedAgent"
                    checked={selectedAgent?.madaily === row.madaily}
                    onChange={() => handleSelectAgent(row)}
                />
            ) : (index + 1)
        },
        {
            header: 'Mã đại lý',
            accessor: 'madaily',
            width: '8%',
            cellClassName: 'fw-bold text-primary'
        },
        {
            header: 'Tên đại lý',
            accessor: 'tendaily',
            width: '15%'
        },
        {
            header: 'Địa chỉ',
            accessor: 'diachi',
            width: '20%'
        },
        {
            header: 'Số điện thoại',
            accessor: 'sodienthoai',
            width: '10%'
        },
        {
            header: 'Email',
            accessor: 'email',
            width: '15%'
        },
        {
            header: 'Quận',
            accessor: 'tenquan',
            width: '10%'
        },
        {
            header: 'Ngày tiếp nhận',
            accessor: 'ngaytiepnhan',
            width: '10%',
            render: (row) => formatDate(row.ngaytiepnhan)
        },
        {
            header: 'Công nợ',
            accessor: 'congno',
            width: '12%',
            cellClassName: 'text-end',
            render: (row) => formatMoney(row.congno)
        }
    ];

    return (
        <div className={`container-fluid ${isModal ? '' : 'px-0 mt-4'}`}>
            {!isModal && <h1 className="ms-3">Tìm kiếm đại lý</h1>}

            {/* Alert messages */}
            {successMessage && (
                <Alert variant="success" className={isModal ? 'mx-0 mb-3' : 'mx-3'} dismissible onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {errorMessage && (
                <Alert variant="danger" className={isModal ? 'mx-0 mb-3' : 'mx-3'} dismissible onClose={() => setErrorMessage('')}>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {errorMessage}
                    </div>
                </Alert>
            )}

            {infoMessage && (
                <Alert variant="info" className={isModal ? 'mx-0 mb-3' : 'mx-3'} dismissible onClose={() => setInfoMessage('')}>
                    {infoMessage}
                </Alert>
            )}

            <div className={isModal ? 'p-3' : 'px-3'}>
                <div className="container-fluid">
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white text-center py-3">
                            <h4 className="mb-0">🔍 {isModal ? 'Chọn đại lý' : 'Tìm kiếm đại lý'}</h4>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {/* Search form content */}
                            <Accordion defaultActiveKey="0" className="mb-4">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Body className="bg-light">
                                        {/* Search form fields */}
                                        <Form onSubmit={handleSearch}>
                                            <Accordion alwaysOpen defaultActiveKey={["0"]}>
                                                {/* Basic Search Criteria */}
                                                <Accordion.Item eventKey="0" className="mb-2">
                                                    <Accordion.Header>Thông tin cơ bản</Accordion.Header>
                                                    <Accordion.Body className="p-4">
                                                        <div className="bg-light rounded p-4">
                                                            <Row className="g-3">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Mã đại lý</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập mã đại lý"
                                                                            value={searchCriteria.madaily}
                                                                            onChange={(e) => handleInputChange('madaily', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Tên đại lý</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập tên đại lý"
                                                                            value={searchCriteria.tendaily}
                                                                            onChange={(e) => handleInputChange('tendaily', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Số điện thoại</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập số điện thoại"
                                                                            value={searchCriteria.sodienthoai}
                                                                            onChange={(e) => handleInputChange('sodienthoai', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Địa chỉ</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập địa chỉ"
                                                                            value={searchCriteria.diachi}
                                                                            onChange={(e) => handleInputChange('diachi', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Email</Form.Label>
                                                                        <Form.Control
                                                                            type="email"
                                                                            placeholder="Nhập email"
                                                                            value={searchCriteria.email}
                                                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Loại đại lý</Form.Label>
                                                                        <Typeahead
                                                                            id="loaidaily-typeahead"
                                                                            labelKey="tenloaidaily"
                                                                            options={dsLoaiDaiLy}
                                                                            placeholder="Chọn loại đại lý"
                                                                            clearButton
                                                                            onChange={(selected) => {
                                                                                const value = selected.length > 0 ? selected[0].maloaidaily : '';
                                                                                handleInputChange('maloaidaily', value);
                                                                            }}
                                                                            selected={dsLoaiDaiLy.filter(item => item.maloaidaily === searchCriteria.maloaidaily)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Quận</Form.Label>
                                                                        <Typeahead
                                                                            id="quan-typeahead"
                                                                            labelKey="tenquan"
                                                                            options={dsQuan}
                                                                            placeholder="Chọn quận"
                                                                            clearButton
                                                                            onChange={(selected) => {
                                                                                const value = selected.length > 0 ? selected[0].maquan : '';
                                                                                handleInputChange('maquan', value);
                                                                            }}
                                                                            selected={dsQuan.filter(item => item.maquan === searchCriteria.maquan)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>

                                                {/* Advanced Search Criteria - Agent Information */}
                                                <Accordion.Item eventKey="1" className="mb-2">
                                                    <Accordion.Header>Thông tin đại lý nâng cao</Accordion.Header>
                                                    <Accordion.Body className="p-4">
                                                        <div className="bg-light rounded p-4">
                                                            <Row className="g-3">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Ngày tiếp nhận (Từ)</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            value={searchCriteria.ngaytiepnhan_from}
                                                                            onChange={(e) => handleInputChange('ngaytiepnhan_from', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Ngày tiếp nhận (Đến)</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            value={searchCriteria.ngaytiepnhan_to}
                                                                            onChange={(e) => handleInputChange('ngaytiepnhan_to', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Công nợ (Từ)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.congno_min}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('congno_min', formatted, raw)}
                                                                            placeholder="Nhập công nợ từ"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Công nợ (Đến)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.congno_max}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('congno_max', formatted, raw)}
                                                                            placeholder="Nhập công nợ đến"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>.
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>

                                                {/* Advanced Search Criteria - Export Slip */}
                                                <Accordion.Item eventKey="2" className="mb-2">
                                                    <Accordion.Header>Tiêu chí phiếu xuất</Accordion.Header>
                                                    <Accordion.Body className="p-4">
                                                        <div className="bg-light rounded p-4">
                                                            <Row className="g-3">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Mã phiếu xuất (Từ)</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập mã phiếu xuất từ"
                                                                            value={searchCriteria.maphieuxuat_from}
                                                                            onChange={(e) => handleInputChange('maphieuxuat_from', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Mã phiếu xuất (Đến)</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            placeholder="Nhập mã phiếu xuất đến"
                                                                            value={searchCriteria.maphieuxuat_to}
                                                                            onChange={(e) => handleInputChange('maphieuxuat_to', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Ngày lập (Từ)</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            value={searchCriteria.ngaylap_from}
                                                                            onChange={(e) => handleInputChange('ngaylap_from', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Ngày lập (Đến)</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            value={searchCriteria.ngaylap_to}
                                                                            onChange={(e) => handleInputChange('ngaylap_to', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Row className="g-3 mt-2">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Tổng giá trị xuất (Từ)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.tonggiatri_from}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('tonggiatri_from', formatted, raw)}
                                                                            placeholder="Nhập tổng giá trị xuất từ"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Tổng giá trị xuất (Đến)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.tonggiatri_to}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('tonggiatri_to', formatted, raw)}
                                                                            placeholder="Nhập tổng giá trị xuất đến"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>

                                                {/* Product/Item Criteria */}
                                                <Accordion.Item eventKey="3" className="mb-2">
                                                    <Accordion.Header>Thông tin mặt hàng</Accordion.Header>
                                                    <Accordion.Body className="p-4">
                                                        <div className="bg-light rounded p-4">
                                                            <Row className="g-3" md={"auto"}>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Tên mặt hàng</Form.Label>
                                                                        <Typeahead
                                                                            id="mathang-typeahead"
                                                                            labelKey="tenmathang"
                                                                            options={dsMatHang}
                                                                            placeholder="Chọn mặt hàng"
                                                                            clearButton
                                                                            onChange={(selected) => {
                                                                                const value = selected.length > 0 ? selected[0].mamathang : '';
                                                                                handleInputChange('mamathang', value);
                                                                            }}
                                                                            selected={dsMatHang.filter(item => item.mamathang === searchCriteria.mamathang)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Đơn vị tính</Form.Label>
                                                                        <Typeahead
                                                                            id="donvitinh-typeahead"
                                                                            labelKey="tendonvitinh"
                                                                            options={dsDonViTinh}
                                                                            placeholder="Chọn đơn vị tính"
                                                                            clearButton
                                                                            onChange={(selected) => {
                                                                                const value = selected.length > 0 ? selected[0].madonvitinh : '';
                                                                                handleInputChange('madonvitinh', value);
                                                                            }}
                                                                            selected={dsDonViTinh.filter(item => item.madonvitinh === searchCriteria.madonvitinh)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Row className="g-3 mt-2">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Số lượng xuất (Từ)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            placeholder="Nhập số lượng xuất từ"
                                                                            value={searchCriteria.soluongxuat_from}
                                                                            onChange={(e) => handleInputChange('soluongxuat_from', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Số lượng xuất (Đến)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            placeholder="Nhập số lượng xuất đến"
                                                                            value={searchCriteria.soluongxuat_to}
                                                                            onChange={(e) => handleInputChange('soluongxuat_to', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Đơn giá xuất (Từ)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.dongiaxuat_from}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('dongiaxuat_from', formatted, raw)}
                                                                            placeholder="Nhập đơn giá xuất từ"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Đơn giá xuất (Đến)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.dongiaxuat_to}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('dongiaxuat_to', formatted, raw)}
                                                                            placeholder="Nhập đơn giá xuất đến"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Row className="g-3 mt-2">
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Thành tiền (Từ)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.thanhtien_from}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('thanhtien_from', formatted, raw)}
                                                                            placeholder="Nhập thành tiền từ"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Thành tiền (Đến)</Form.Label>
                                                                        <MoneyInput
                                                                            value={searchCriteria.thanhtien_to}
                                                                            onChange={(formatted, raw) => handleMoneyInputChange('thanhtien_to', formatted, raw)}
                                                                            placeholder="Nhập thành tiền đến"
                                                                            readOnly={false}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Số lượng tồn (Từ)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            placeholder="Nhập số lượng tồn từ"
                                                                            value={searchCriteria.soluongton_from}
                                                                            onChange={(e) => handleInputChange('soluongton_from', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-medium mb-2">Số lượng tồn (Đến)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            placeholder="Nhập số lượng tồn đến"
                                                                            value={searchCriteria.soluongton_to}
                                                                            onChange={(e) => handleInputChange('soluongton_to', e.target.value)}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>

                                            <div className="d-flex flex-wrap gap-2 justify-content-center pt-3 border-top">
                                                <Button type="submit" variant="primary" disabled={isLoading} className="px-4">
                                                    {isLoading ? 'Đang tìm kiếm...' : '🔍 Tìm kiếm'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline-secondary"
                                                    onClick={handleClearSearch}
                                                    disabled={isLoading}
                                                    className="px-4"
                                                >
                                                    🗑️ Xóa bộ lọc
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline-secondary"
                                                    onClick={handleExitToHome}
                                                    className="px-4"
                                                >
                                                    ❌ {isModal ? "Đóng" : "Thoát"}
                                                </Button>
                                            </div>
                                        </Form>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Card.Body>
                    </Card>
                    {/* Results section */}
                    {searchPerformed && (
                        <Card className={isModal ? "mt-3" : "container-fluid mt-4"}>
                            <Card.Header className="bg-primary text-white py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        📋 Kết quả tìm kiếm ({searchResults.length} kết quả)
                                    </h5>
                                    {isModal && selectedAgent && (
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            onClick={handleConfirmSelection}
                                        >
                                            ✓ Chọn đại lý này
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <DataTable
                                    data={searchResults}
                                    columns={searchColumns}
                                    pageSize={10}
                                    searchable={false}
                                    sortable={true}
                                />
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
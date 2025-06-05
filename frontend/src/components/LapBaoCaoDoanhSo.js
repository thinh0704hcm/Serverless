import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getMonthlyRevenueReport } from '../services/api';
import { DataTable } from './DataTable';
import { formatMoney } from '../utils/formatters';
import { MoneyInput } from './MoneyInput';

export const LapBaoCaoDoanhSo = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [tongDoanhSo, setTongDoanhSo] = useState('0');
  const [soLuongDaiLy, setSoLuongDaiLy] = useState(0);
  const [baoCaoData, setBaoCaoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate years array (2000 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => 2000 + i);

  // Generate months array
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  const handleLapBaoCao = async () => {
    setLoading(true);
    setError('');

    try {
      const requestData = {
        month: selectedMonth,
        year: selectedYear
      };

      console.log('=== REQUEST DEBUG ===');
      console.log('Request data:', requestData);
      console.log('JSON string:', JSON.stringify(requestData));
      console.log('====================');

      const reportData = await getMonthlyRevenueReport(requestData);

      console.log('=== RESPONSE DEBUG ===');
      console.log('Response data:', reportData);
      console.log('Response type:', typeof reportData);
      console.log('Response JSON string:', JSON.stringify(reportData, null, 2));
      console.log('tongdoanhso:', reportData.tongdoanhso, 'type:', typeof reportData.tongdoanhso);
      console.log('soluongdaily:', reportData.soluongdaily, 'type:', typeof reportData.soluongdaily);
      console.log('chitiet:', reportData.chitiet);
      if (reportData.chitiet && reportData.chitiet.length > 0) {
        console.log('First chitiet item:', reportData.chitiet[0]);
        console.log('tonggiatrigiaodich of first item:', reportData.chitiet[0].tonggiatrigiaodich, 'type:', typeof reportData.chitiet[0].tonggiatrigiaodich);
      }
      console.log('======================');

      // Update state with received data - format for display
      setTongDoanhSo(formatMoney(reportData.tongdoanhso || '0'));
      setSoLuongDaiLy(reportData.soluongdaily || 0);

      // Map the chitiet data to the expected format - format monetary values
      const formattedData = reportData.chitiet?.map(item => ({
        tenDaiLy: item.tendaily,
        soLuongPhieuXuat: item.soluongphieuxuat,
        tongGiaTriGiaoDich: formatMoney(item.tonggiatrigiaodich || '0'),
        tiLe: `${item.tilephantramdoanhso}%`
      })) || [];

      setBaoCaoData(formattedData);

    } catch (err) {
      console.error('=== ERROR DEBUG ===');
      console.error('Full error object:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('==================');
      setError('Có lỗi xảy ra khi lập báo cáo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleThoat = () => {
    // Reset form
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setTongDoanhSo('0');
    setSoLuongDaiLy(0);
    setBaoCaoData([]);
    setError('');
  };

  const handleExitToHome = () => {
    navigate("/");
  };

  // Define columns for báo cáo DataTable
  const baoCaoColumns = [
    {
      header: 'STT',
      accessor: 'stt',
      width: '8%',
      cellClassName: 'text-center',
      render: (row, index) => index + 1
    },
    {
      header: 'Tên đại lý',
      accessor: 'tenDaiLy',
      width: '30%'
    },
    {
      header: 'Số lượng phiếu xuất',
      accessor: 'soLuongPhieuXuat',
      width: '20%',
      cellClassName: 'text-center'
    },
    {
      header: 'Tổng giá trị giao dịch trong tháng',
      accessor: 'tongGiaTriGiaoDich',
      width: '25%',
      cellClassName: 'text-end'
    },
    {
      header: 'Tỉ lệ',
      accessor: 'tiLe',
      width: '17%',
      cellClassName: 'text-center'
    }
  ];

  return (
    <div className="container-fluid px-0 mt-4">
      <h1 className="ms-3">Lập báo cáo doanh số</h1>

      {/* Alert messages */}
      {baoCaoData.length > 0 && (
        <Alert variant="success" className="mx-3" dismissible onClose={() => setBaoCaoData([])}>
          <strong>Lập báo cáo thành công!</strong> Báo cáo cho tháng {selectedMonth}/{selectedYear} đã được tạo.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mx-3" dismissible onClose={() => setError('')}>
          <strong>Lỗi:</strong> 
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
            {error}
          </div>
        </Alert>
      )}

      {loading && (
        <Alert variant="info" className="mx-3">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Đang lập báo cáo...</span>
            </div>
            Đang lập báo cáo doanh số cho tháng {selectedMonth}/{selectedYear}...
          </div>
        </Alert>
      )}

      <div className="px-3">
        <div className="container-fluid mb-4">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">📊 Lập Báo Cáo Doanh Số</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form>
                <div className="bg-light rounded p-4 mb-4">
                  <h6 className="text-primary fw-semibold mb-3 border-bottom border-primary pb-2">Thông tin báo cáo</h6>
                  <Row className="g-3" md={"auto"}>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Năm lập báo cáo</Form.Label>
                        <Form.Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Tháng lập báo cáo</Form.Label>
                        <Form.Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Form>
              <div className="d-flex flex-wrap gap-2 justify-content-center pt-3 border-top mt-4">
            <Button
              type="button"
              variant="primary"
              onClick={handleLapBaoCao}
              disabled={loading}
              className="px-4"
            >
              {loading ? 'Đang lập báo cáo...' : '📊 Lập báo cáo doanh số'}
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleThoat}
              className="px-4"
            >
              🗑️ Làm mới
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleExitToHome}
              className="px-4"
            >
              ❌ Thoát
            </Button>
          </div>
            </Card.Body>
          </Card>
        </div>

        <div className="container-fluid mt-4 mb-3">
          <Card>
            <Card.Header className="bg-primary text-white text-center py-3">
              <h5 className="mb-0 text-white">📊 Kết quả báo cáo</h5>
            </Card.Header>
            <Card.Body className="p-4">

              {/* Total sales row */}
              <Row className="mb-3">
                <Col className="d-flex justify-content-center align-items-center gap-3">
                  <span style={{ fontWeight: 'bold' }}>
                    Tổng doanh số trong tháng của tất cả đại lý ({soLuongDaiLy} đại lý):
                  </span>
                  <MoneyInput
                    value={tongDoanhSo}
                    readOnly={true}
                    style={{ width: '200px' }}
                    className="text-center"
                  />
                </Col>
              </Row>

              {/* Report table wrapper with Sprint 1 style */}
              <DataTable
                data={baoCaoData}
                columns={baoCaoColumns}
                pageSize={15}
                searchable={false}
                sortable={true}
                bordered={true}
              />


            </Card.Body>
          </Card>
        </div>
      </div >
    </div >
  );
};

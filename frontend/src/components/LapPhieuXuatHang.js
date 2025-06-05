import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Card, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Typeahead } from 'react-bootstrap-typeahead';
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";
import { getAllDaily, createPhieuXuat, getAllMatHang, getAllPhieuXuat } from '../services/api';
import { DaiLySelectionModal } from './DaiLySelectionModal';
import { DataTable } from './DataTable';
import { formatMoney } from '../utils/formatters';
import { MoneyInput } from './MoneyInput';

export const LapPhieuXuatHang = () => {
  const { register, handleSubmit, setValue, reset, clearErrors, formState: { errors }, watch } = useForm();
  const navigate = useNavigate();

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [daiLyList, setDaiLyList] = useState([]);
  const [matHangList, setMatHangList] = useState([]);
  const [chiTietPhieu, setChiTietPhieu] = useState([
    { stt: 1, tenMatHang: '', tenDonViTinh: '', soLuongTon: '', soLuongXuat: '', donGiaXuat: '', thanhTien: '' }
  ]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showDaiLyModal, setShowDaiLyModal] = useState(false);
  const [selectedDaiLyForForm, setSelectedDaiLyForForm] = useState([]);

  const fetchDaiLyList = async () => {
    try {
      const data = await getAllDaily();
      setDaiLyList(data);
    } catch (error) {
      console.error('Error fetching agent list:', error);
    }
  };

  const fetchMatHangList = async () => {
    try {
      const data = await getAllMatHang();
      setMatHangList(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
    }
  };

  const generateMaPhieuXuat = useCallback(async () => {
    try {
      const phieuXuatList = await getAllPhieuXuat();
      console.log('Current phieu xuat list:', phieuXuatList);

      // Get the count and add 1 for next ID
      const currentCount = Array.isArray(phieuXuatList) ? phieuXuatList.length : 0;
      const nextNumber = currentCount + 1;

      // Format with leading zeros (5 digits total)
      const formattedNumber = nextNumber.toString().padStart(5, '0');
      const newMaPhieuXuat = `PX${formattedNumber}`;

      console.log('Generated new MaPhieuXuat:', newMaPhieuXuat);
      setValue("maPhieuXuat", newMaPhieuXuat);
    } catch (error) {
      console.error('Error generating export receipt ID:', error);
      // Fallback to manual input if API fails
      setValue("maPhieuXuat", "");
    }
  }, [setValue]);

  const handleDaiLyChange = (selected) => {
    const selectedMaDaiLy = selected.length > 0 ? selected[0].madaily : '';
    setValue("tenDaiLy", selectedMaDaiLy);
    setSelectedDaiLyForForm(selected);

    clearErrors("tenDaiLy");

    if (selectedMaDaiLy) {
      loadDaiLyInfo(selectedMaDaiLy);
    } else {
      // Clear all agent-related fields when no selection
      setValue("noDaiLy", "");
      setValue("noToiDa", "");
      setValue("noDaiLyRaw", 0);
      setValue("noToiDaRaw", 0);
    }
  };

  const loadDaiLyInfo = (maDaiLy) => {
    try {
      const selectedAgent = daiLyList.find(agent => agent.madaily === maDaiLy);

      if (selectedAgent) {
        const formattedNoDaiLy = formatMoney(selectedAgent.congno || '0');
        const formattedNoToiDa = formatMoney(selectedAgent.notoida || '0');

        setValue("noDaiLy", formattedNoDaiLy);
        setValue("noToiDa", formattedNoToiDa);

        // Also store raw values for calculations
        setValue("noDaiLyRaw", selectedAgent.congno || 0);
        setValue("noToiDaRaw", selectedAgent.notoida || 0);
      }
    } catch (error) {
      console.error('Error loading agent info:', error);
    }
  };

  useEffect(() => {
    fetchDaiLyList();
    fetchMatHangList();
    generateMaPhieuXuat();
    setValue("ngayLap", getCurrentDate());
  }, [setValue, generateMaPhieuXuat]);

  const handleMatHangChange = (index, selectedMatHang) => {
    const selectedProduct = matHangList.find(mh => mh.mamathang === selectedMatHang);
    const newChiTiet = [...chiTietPhieu];

    if (selectedProduct) {
      newChiTiet[index] = {
        ...newChiTiet[index],
        tenMatHang: selectedMatHang,
        tenDonViTinh: selectedProduct.tendonvitinh || '',
        soLuongTon: selectedProduct.soluongton || '0'
      };
    } else {
      newChiTiet[index] = {
        ...newChiTiet[index],
        tenMatHang: '',
        tenDonViTinh: '',
        soLuongTon: ''
      };
    }

    setChiTietPhieu(newChiTiet);
    calculateThanhTien(index, newChiTiet);
  };

  const handleSoLuongXuatChange = (index, value) => {
    const newChiTiet = [...chiTietPhieu];
    newChiTiet[index].soLuongXuat = value;
    setChiTietPhieu(newChiTiet);
    calculateThanhTien(index, newChiTiet);
  };

  const handleDonGiaXuatChange = (index, formattedValue, rawValue) => {
    const newChiTiet = [...chiTietPhieu];
    newChiTiet[index].donGiaXuat = rawValue; // Store raw value for calculation
    newChiTiet[index].donGiaXuatFormatted = formattedValue; // Store formatted value for display
    setChiTietPhieu(newChiTiet);
    calculateThanhTien(index, newChiTiet);
  };

  const calculateThanhTien = (index, chiTiet) => {
    const soLuong = parseFloat(chiTiet[index].soLuongXuat) || 0;
    const donGia = parseFloat(chiTiet[index].donGiaXuat) || 0; // Use raw value
    const thanhTien = soLuong * donGia;

    // Store raw number value for calculation
    chiTiet[index].thanhTienValue = thanhTien;
    // Store formatted value for display
    chiTiet[index].thanhTien = formatMoney(thanhTien);

    // Calculate total from all items
    calculateTongTien(chiTiet);
  };

  const calculateTongTien = (chiTiet) => {
    const tongTien = chiTiet.reduce((sum, item) => {
      const itemThanhTien = item.thanhTienValue || 0;
      return sum + itemThanhTien;
    }, 0);

    const formattedTongTien = formatMoney(tongTien);
    setValue("tongTien", formattedTongTien);
    setValue("tongTienRaw", tongTien); // Store raw value for calculations
  };

  const addRow = () => {
    setChiTietPhieu([...chiTietPhieu, {
      stt: chiTietPhieu.length + 1,
      tenMatHang: '',
      tenDonViTinh: '',
      soLuongTon: '',
      soLuongXuat: '',
      donGiaXuat: '',
      thanhTien: ''
    }]);
  };

  const removeRow = (index) => {
    if (chiTietPhieu.length > 1) {
      const newChiTiet = chiTietPhieu.filter((_, i) => i !== index);
      // Renumber STT
      newChiTiet.forEach((item, i) => {
        item.stt = i + 1;
      });
      setChiTietPhieu(newChiTiet);
      // Recalculate total after removing row
      calculateTongTien(newChiTiet);
    }
  };

  const submitHandler = async (data) => {
    // Validation checks before submission
    const validationErrors = [];

    // Check if no items are selected
    const hasSelectedItems = chiTietPhieu.some(item => item.tenMatHang);
    if (!hasSelectedItems) {
      validationErrors.push('Phải chọn ít nhất một mặt hàng để xuất');
    }

    // Check for missing required fields in selected items
    chiTietPhieu.forEach((item, index) => {
      if (item.tenMatHang) {
        // If item is selected, check required fields
        if (!item.soLuongXuat || item.soLuongXuat === '0') {
          const selectedProduct = matHangList.find(mh => mh.mamathang === item.tenMatHang);
          const tenMatHang = selectedProduct ? selectedProduct.tenmathang : item.tenMatHang;
          validationErrors.push(`Mặt hàng "${tenMatHang}" chưa nhập số lượng xuất`);
        }

        if (!item.donGiaXuat || item.donGiaXuat === '0') {
          const selectedProduct = matHangList.find(mh => mh.mamathang === item.tenMatHang);
          const tenMatHang = selectedProduct ? selectedProduct.tenmathang : item.tenMatHang;
          validationErrors.push(`Mặt hàng "${tenMatHang}" chưa nhập đơn giá xuất`);
        }
      }
    });

    // Check inventory for each item
    chiTietPhieu.forEach((item, index) => {
      if (item.tenMatHang && item.soLuongXuat) {
        const soLuongTon = parseInt(item.soLuongTon) || 0;
        const soLuongXuat = parseInt(item.soLuongXuat) || 0;

        if (soLuongXuat > soLuongTon) {
          const selectedProduct = matHangList.find(mh => mh.mamathang === item.tenMatHang);
          const tenMatHang = selectedProduct ? selectedProduct.tenmathang : item.tenMatHang;
          validationErrors.push(`Mặt hàng "${tenMatHang}" có số lượng tồn (${soLuongTon}) nhỏ hơn số lượng xuất (${soLuongXuat})`);
        }
      }
    });

    // Check debt limit - use raw values directly
    const noDaiLy = data.noDaiLyRaw || 0;
    const tongTienRaw = data.tongTienRaw || 0;
    const noToiDa = data.noToiDaRaw || 0;
    const noSauGiaoDich = noDaiLy + tongTienRaw;

    console.log('=== DEBT CALCULATION DEBUG ===');
    console.log('noDaiLy (raw):', noDaiLy, typeof noDaiLy);
    console.log('tongTienRaw:', tongTienRaw, typeof tongTienRaw);
    console.log('noToiDa (raw):', noToiDa, typeof noToiDa);
    console.log('noSauGiaoDich:', noSauGiaoDich);
    console.log('===============================');

    if (noSauGiaoDich > noToiDa) {
      validationErrors.push(`Nợ sau giao dịch (${formatMoney(noSauGiaoDich)} VNĐ) vượt quá nợ tối đa (${formatMoney(noToiDa)} VNĐ)`);
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      const errorMsg = `Không thể lập phiếu xuất:\n${validationErrors.join('\n')}`;
      setErrorMessage(errorMsg);
      setShowError(true);

      setTimeout(() => {
        setShowError(false);
      }, 8000);
      return;
    }

    setLoadingMessage("Đang lập phiếu xuất...");
    setShowLoading(true);
    try {
      // Use the date directly from the date picker (already in YYYY-MM-DD format)
      const formattedDate = data.ngayLap;

      // Prepare chi tiết data
      const chitiet = chiTietPhieu
        .filter(item => item.tenMatHang && item.soLuongXuat && item.donGiaXuat)
        .map(item => ({
          mamathang: item.tenMatHang,
          soluongxuat: parseInt(item.soLuongXuat),
          dongiaxuat: parseInt(parseFloat(item.donGiaXuat)), // Use raw value
          thanhtien: parseInt(item.thanhTienValue || 0) // Use raw value
        }));

      const phieuXuatData = {
        maphieuxuat: data.maPhieuXuat,
        madaily: data.tenDaiLy,
        ngaylap: formattedDate,
        tonggiatri: parseInt(tongTienRaw), // Use raw value
        chitiet: chitiet
      };

      // Debug: Log the exact data being sent
      console.log('=== DEBUG: Data being sent to API ===');
      console.log('Form data received:', data);
      console.log('data.tongTien:', data.tongTien, 'type:', typeof data.tongTien);
      console.log('After removing dots and commas:', data.tongTien.replace(/\./g, '').replace(/,/g, ''));
      console.log('After parseFloat:', parseFloat(data.tongTien.replace(/\./g, '').replace(/,/g, '')));
      console.log('After parseInt:', parseInt(parseFloat(data.tongTien.replace(/\./g, '').replace(/,/g, '')) || 0));
      console.log('Chi tiết phiếu array:', chiTietPhieu);
      console.log('Filtered chi tiết:', chitiet);
      console.log('Final phieuXuatData:', phieuXuatData);
      console.log('JSON string to be sent:');
      console.log(JSON.stringify(phieuXuatData, null, 2));
      console.log('=====================================');

      const result = await createPhieuXuat(phieuXuatData);
      console.log('Lập phiếu xuất hàng thành công:', result);

      // Display message from backend if available, otherwise default success message
      const message = result?.message || "Lập phiếu xuất thành công";
      setSuccessMessage(message);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      await fetchDaiLyList();
      await fetchMatHangList();
      handleThoat();
    } catch (error) {
      console.error('Error creating export receipt:', error);
      alert('Có lỗi xảy ra khi lập phiếu xuất hàng: ' + error.message);
    } finally {
      setShowLoading(false);
    }
  };

  const handleThoat = () => {
    reset();
    setValue("ngayLap", getCurrentDate());
    generateMaPhieuXuat();
    setSelectedDaiLyForForm([]);
    setChiTietPhieu([
      { stt: 1, tenMatHang: '', tenDonViTinh: '', soLuongTon: '', soLuongXuat: '', donGiaXuat: '', thanhTien: '' }
    ]);
  };

  const handleExitToHome = () => {
    navigate("/");
  };

  const handleDaiLySelect = (daiLy) => {
    setValue("tenDaiLy", daiLy.madaily);
    setSelectedDaiLyForForm([daiLy]);

    const formattedNoDaiLy = formatMoney(daiLy.congno || '0');
    const formattedNoToiDa = formatMoney(daiLy.notoida || '0');

    setValue("noDaiLy", formattedNoDaiLy);
    setValue("noToiDa", formattedNoToiDa);

    // Store raw values
    setValue("noDaiLyRaw", daiLy.congno || 0);
    setValue("noToiDaRaw", daiLy.notoida || 0);

    setShowDaiLyModal(false);
    clearErrors("tenDaiLy");
  };

  const handleOpenDaiLyModal = () => {
    setShowDaiLyModal(true);
  };

  // Define columns for chi tiết mặt hàng DataTable
  const chiTietColumns = [
    {
      header: 'STT',
      accessor: 'stt',
      width: '5%',
      cellClassName: 'text-center'
    },
    {
      header: 'Tên mặt hàng',
      accessor: 'tenMatHang',
      width: '23%',
      sortable: false,
      render: (row, index) => {
        // Filter out already selected products from other rows
        const selectedProducts = chiTietPhieu
          .map((item, i) => i !== index ? item.tenMatHang : null)
          .filter(Boolean);

        const availableOptions = matHangList.filter(mh =>
          !selectedProducts.includes(mh.mamathang)
        );

        return (
          <Typeahead
            id={`mathang-typeahead-${index}`}
            labelKey="tenmathang"
            options={availableOptions}
            placeholder="Chọn mặt hàng"
            clearButton
            selected={matHangList.filter(mh => mh.mamathang === row.tenMatHang)}
            onChange={(selected) => {
              const value = selected.length > 0 ? selected[0].mamathang : '';
              handleMatHangChange(index, value);
            }}
          />
        );
      }
    },
    {
      header: 'Tên đơn vị tính',
      accessor: 'tenDonViTinh',
      width: '15%',
      sortable: false,
      render: (row) => (
        <Form.Control
          type="text"
          value={row.tenDonViTinh}
          readOnly
        />
      )
    },
    {
      header: 'Số lượng tồn',
      accessor: 'soLuongTon',
      width: '10%',
      sortable: false,
      render: (row) => (
        <Form.Control
          type="text"
          value={row.soLuongTon}
          readOnly
        />
      )
    },
    {
      header: 'Số lượng xuất',
      accessor: 'soLuongXuat',
      width: '10%',
      sortable: false,
      render: (row, index) => (
        <Form.Control
          type="number"
          value={row.soLuongXuat}
          onChange={(e) => handleSoLuongXuatChange(index, e.target.value)}
          min="0"
          step="1"
        />
      )
    },
    {
      header: 'Đơn giá xuất',
      accessor: 'donGiaXuat',
      width: '15%',
      sortable: false,
      render: (row, index) => (
        <MoneyInput
          value={row.donGiaXuatFormatted || formatMoney(row.donGiaXuat || 0)}
          onChange={(formatted, raw) => handleDonGiaXuatChange(index, formatted, raw)}
          placeholder="0"
          readOnly={false}
        />
      )
    },
    {
      header: 'Thành tiền',
      accessor: 'thanhTien',
      width: '15%',
      sortable: false,
      render: (row) => (
        <MoneyInput
          value={row.thanhTien || '0'}
          readOnly={true}
        />
      )
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      width: '7%',
      sortable: false,
      cellClassName: 'text-center',
      render: (row, index) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => removeRow(index)}
          disabled={chiTietPhieu.length === 1}
        >
          Xóa
        </Button>
      )
    }
  ];

  return (
    <div className="container-fluid px-0 mt-4">
      <h1 className="ms-3">Lập phiếu xuất hàng</h1>

      {/* Alert messages following TiepNhanDaiLy pattern */}
      {showSuccess && (
        <div className="alert alert-success mx-3" role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <span>{successMessage}</span>
            <button
              className="btn btn-outline-primary btn-sm ms-2"
              onClick={() => setShowSuccess(false)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}

      {showLoading && (
        <div className="alert alert-info mx-3" role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <span>{loadingMessage}</span>
            <button
              className="btn btn-outline-primary btn-sm ms-2"
              onClick={() => setShowLoading(false)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}

      {showError && (
        <div className="alert alert-danger mx-3" role="alert">
          <div className="d-flex justify-content-between align-items-start">
            <div style={{ whiteSpace: 'pre-line', flex: 1 }}>
              {errorMessage}
            </div>
            <button
              className="btn btn-outline-primary btn-sm ms-2"
              onClick={() => setShowError(false)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}

      <div className="px-3">
        <div className="container-fluid">
          <Card>
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">📋 Lập Phiếu Xuất Hàng</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit(submitHandler)}>
                <div className="bg-light rounded p-4 mb-4">
                  <h6 className="text-primary fw-semibold mb-3 border-bottom border-primary pb-2">Thông tin phiếu xuất</h6>

                  {/* Form fields in responsive rows */}
                  <Row className="g-3 mb-3">
                    <Col sm="auto">
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Mã phiếu xuất</Form.Label>
                        <Form.Control
                          type="text"
                          readOnly
                          {...register("maPhieuXuat", { required: "Mã phiếu xuất là bắt buộc" })}
                          placeholder="Mã phiếu xuất"
                        />
                        {errors.maPhieuXuat && <div className="text-danger small mt-1">{errors.maPhieuXuat.message}</div>}
                      </Form.Group>
                    </Col>

                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Tên đại lý</Form.Label>
                        <Typeahead
                          id="daily-typeahead"
                          labelKey={(option) => `${option.madaily} - ${option.tendaily}`}
                          options={daiLyList}
                          placeholder="Chọn đại lý"
                          clearButton
                          selected={selectedDaiLyForForm}
                          onChange={handleDaiLyChange}
                        />
                        {errors.tenDaiLy && <div className="text-danger small mt-1">{errors.tenDaiLy.message}</div>}
                      </Form.Group>
                    </Col>

                    <Col sm={1}>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Nợ đại lý</Form.Label>
                        <MoneyInput
                          value={watch("noDaiLy") || '0'}
                          readOnly={true}
                          placeholder="Nợ hiện tại"
                        />
                        {/* Hidden field for raw value */}
                        <input type="hidden" {...register("noDaiLyRaw")} />
                      </Form.Group>
                    </Col>

                    <Col sm="auto">
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Nợ tối đa</Form.Label>
                        <MoneyInput
                          value={watch("noToiDa") || '0'}
                          readOnly={true}
                          placeholder="Nợ tối đa"
                        />
                        {/* Hidden field for raw value */}
                        <input type="hidden" {...register("noToiDaRaw")} />
                      </Form.Group>
                    </Col>

                    <Col sm="auto">
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Ngày lập</Form.Label>
                        <Form.Control
                          type="date"
                          {...register("ngayLap", {
                            required: "Ngày lập là bắt buộc"
                          })}
                        />
                        {errors.ngayLap && <div className="text-danger small mt-1">{errors.ngayLap.message}</div>}
                      </Form.Group>
                    </Col>

                    <Col sm="auto">
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Tổng tiền</Form.Label>
                        <MoneyInput
                          value={watch("tongTien") || '0'}
                          readOnly={true}
                          placeholder="0"
                        />
                        {/* Hidden field for raw value */}
                        <input type="hidden" {...register("tongTienRaw")} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Chi tiết mặt hàng */}
                <div className="bg-light rounded p-4 mb-4">
                  <h6 className="text-primary fw-semibold mb-3 border-bottom border-primary pb-2">
                    Danh sách mặt hàng
                  </h6>
                  <div style={{ overflow: 'visible' }}>
                    <DataTable
                      data={chiTietPhieu}
                      columns={chiTietColumns}
                      pageSize={20}
                      searchable={false}
                      sortable={false}
                      bordered={true}
                    />
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={addRow}
                    >
                      ➕ Thêm dòng
                    </Button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-center mt-4 pt-3 border-top">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={showLoading}
                    className="px-4"
                  >
                    {showLoading ? 'Đang lập phiếu xuất...' : '📋 Lập phiếu xuất hàng'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={handleOpenDaiLyModal}
                    className="px-4"
                  >
                    🔍 Tìm đại lý
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
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* DaiLy Selection Modal */}
      <DaiLySelectionModal
        show={showDaiLyModal}
        onHide={() => setShowDaiLyModal(false)}
        onSelect={handleDaiLySelect}
      />
    </div>
  );
};
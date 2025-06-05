import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Row, Col } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Typeahead } from 'react-bootstrap-typeahead';
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";
import { getAllDaily, createPhieuThu } from '../services/api';
import { DaiLySelectionModal } from './DaiLySelectionModal';
import { MoneyInput } from './MoneyInput';
import { formatMoney } from '../utils/formatters';

export const LapPhieuThuTien = () => {
  const { register, handleSubmit, setValue, reset, clearErrors, formState: { errors }, control } = useForm();
  const navigate = useNavigate();

  const [daiLyList, setDaiLyList] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showDaiLyModal, setShowDaiLyModal] = useState(false);
  const [selectedDaiLyForForm, setSelectedDaiLyForForm] = useState([]);
  const [soTienThuFormatted, setSoTienThuFormatted] = useState('0');
  const [soTienThuRaw, setSoTienThuRaw] = useState(0);
  const [noCuaDaiLyFormatted, setNoCuaDaiLyFormatted] = useState('0');

  // Watch for form value changes
  const watchedNoCuaDaiLy = useWatch({
    control,
    name: "noCuaDaiLy",
    defaultValue: '0'
  });

  // Update formatted display when form value changes
  useEffect(() => {
    if (watchedNoCuaDaiLy) {
      setNoCuaDaiLyFormatted(watchedNoCuaDaiLy);
    }
  }, [watchedNoCuaDaiLy]);

  useEffect(() => {
    fetchDaiLyList();
  }, [setValue]);

  const fetchDaiLyList = async () => {
    try {
      const data = await getAllDaily();
      setDaiLyList(data);
    } catch (error) {
      console.error('Error fetching agent list:', error);
    }
  };

  const handleDaiLyChange = (selected) => {
    const selectedMaDaiLy = selected.length > 0 ? selected[0].madaily : '';
    setValue("tenDaiLy", selectedMaDaiLy);
    setSelectedDaiLyForForm(selected);

    // Clear validation error for agent selection
    clearErrors("tenDaiLy");

    if (selectedMaDaiLy) {
      // Load thông tin đại lý khi chọn
      loadDaiLyInfo(selectedMaDaiLy);
    } else {
      // Clear form if no selection
      setValue("noCuaDaiLy", "");
      setValue("dienThoai", "");
      setValue("email", "");
      setValue("diaChi", "");
    }
  };

  const loadDaiLyInfo = (maDaiLy) => {
    try {
      // Find the selected agent from the list
      const selectedAgent = daiLyList.find(agent => agent.madaily === maDaiLy);

      if (selectedAgent) {
        const formattedDebt = formatMoney(selectedAgent.congno || '0');
        setValue("noCuaDaiLy", formattedDebt);
        setNoCuaDaiLyFormatted(formattedDebt);
        setValue("dienThoai", selectedAgent.sodienthoai || '');
        setValue("email", selectedAgent.email || '');
        setValue("diaChi", selectedAgent.diachi || '');
      }
    } catch (error) {
      console.error('Error loading agent info:', error);
    }
  };

  const handleSoTienThuChange = (formattedValue, rawValue) => {
    setSoTienThuFormatted(formattedValue);
    setSoTienThuRaw(rawValue);
    setValue("soTienThu", rawValue); // Store raw value for form submission
  };

  const submitHandler = async (data) => {
    setLoadingMessage("Đang lập phiếu thu...");
    setShowLoading(true);
    try {
      // Prepare data for API call
      const phieuThuData = {
        madaily: data.tenDaiLy,
        ngaythutien: data.ngayThuTien,
        sotienthu: soTienThuRaw // Use raw value
      };

      // API call to create payment receipt
      const result = await createPhieuThu(phieuThuData);
      console.log('Lập phiếu thu tiền thành công:', result);

      // Display message from backend if available, otherwise default success message
      const message = result?.message || "Lập phiếu thu thành công";
      setSuccessMessage(message);
      setShowSuccess(true);

      // Auto hide after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      // Fetch updated agent list after successful creation
      await fetchDaiLyList();

      // Clear form after successful creation
      handleThoat();
    } catch (error) {
      console.error('Error creating payment receipt:', error);

      // Display error message in Alert format instead of browser alert
      setErrorMessage(error.message || 'Có lỗi xảy ra khi lập phiếu thu tiền');
      setShowError(true);

      // Auto hide error after 8 seconds
      setTimeout(() => {
        setShowError(false);
      }, 8000);
    } finally {
      setShowLoading(false);
    }
  };

  const handleThoat = () => {
    // Clear form or navigate back
    reset();
    setValue("ngayThuTien", new Date().toISOString().split("T")[0]);
    setSoTienThuFormatted('0');
    setSoTienThuRaw(0);
    setNoCuaDaiLyFormatted('0');
    setSelectedDaiLyForForm([]);
  };

  const handleExitToHome = () => {
    navigate("/");
  };

  const handleDaiLySelect = (daiLy) => {
    setValue("tenDaiLy", daiLy.madaily);
    setSelectedDaiLyForForm([daiLy]);
    const formattedDebt = formatMoney(daiLy.congno || '0');
    setValue("noCuaDaiLy", formattedDebt);
    setNoCuaDaiLyFormatted(formattedDebt);
    setValue("dienThoai", daiLy.sodienthoai || daiLy.dienthoai || '');
    setValue("email", daiLy.email || '');
    setValue("diaChi", daiLy.diachi || '');
    setShowDaiLyModal(false);
    clearErrors("tenDaiLy");
  };

  const handleShowDaiLyModal = () => {
    setShowDaiLyModal(true);
  };

  return (
    <div className="container-fluid px-0 mt-4">
      <h1 className="ms-3">Lập phiếu thu tiền</h1>

      {/* Alert messages */}
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
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5', flex: 1 }}>
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
              <h4 className="mb-0">💰 Lập Phiếu Thu Tiền</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit(submitHandler)}>
                <div className="bg-light rounded p-4 mb-4">
                  <h6 className="text-primary fw-semibold mb-3 border-bottom border-primary pb-2">Thông tin phiếu thu</h6>
                  
                  {/* Responsive form layout */}
                  <Row className="g-3 mb-3">
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
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Nợ của đại lý</Form.Label>
                        <MoneyInput
                          value={noCuaDaiLyFormatted}
                          readOnly={true}
                          placeholder="Nợ hiện tại"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-3">
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Số điện thoại</Form.Label>
                        <Form.Control
                          type="tel"
                          {...register("dienThoai")}
                          placeholder="Số điện thoại"
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Email</Form.Label>
                        <Form.Control
                          type="email"
                          {...register("email")}
                          placeholder="Địa chỉ email"
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-3">
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Địa chỉ</Form.Label>
                        <Form.Control
                          type="text"
                          {...register("diaChi")}
                          placeholder="Địa chỉ"
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Ngày thu tiền</Form.Label>
                        <Form.Control
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          {...register("ngayThuTien", {
                            required: "Ngày thu tiền là bắt buộc"
                          })}
                        />
                        {errors.ngayThuTien && <div className="text-danger small mt-1">{errors.ngayThuTien.message}</div>}
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-medium mb-2">Số tiền thu</Form.Label>
                        <MoneyInput
                          value={soTienThuFormatted}
                          onChange={handleSoTienThuChange}
                          placeholder="Nhập số tiền thu"
                          readOnly={false}
                        />
                        {/* Hidden field for validation */}
                        <input 
                          type="hidden" 
                          {...register("soTienThu", {
                            required: "Số tiền thu là bắt buộc",
                            min: {
                              value: 1,
                              message: "Số tiền thu phải lớn hơn 0"
                            }
                          })}
                        />
                        {errors.soTienThu && <div className="text-danger small mt-1">{errors.soTienThu.message}</div>}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-center pt-3 border-top">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={showLoading}
                    className="px-4"
                  >
                    {showLoading ? 'Đang lập phiếu thu...' : '💰 Lập phiếu thu tiền'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={handleShowDaiLyModal}
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

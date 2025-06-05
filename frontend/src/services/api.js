// src/services/api.js
const API_DOMAIN = 'https://api.thinhuit.id.vn';

async function fetchData(endpoint, method = 'GET', body = null) {
  const url = `${API_DOMAIN}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  const config = {
    method,
    headers,
  };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function fetchSqlData(endpoint, sqlCommand) {
  const response = await fetch(`${API_DOMAIN}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: sqlCommand
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `HTTP error! status: ${response.status}`);
  }
  return response.text();
}

export const insertData = (sqlCommand) => fetchSqlData('/insert', sqlCommand);
export const queryData = (sqlCommand) => fetchSqlData('/query', sqlCommand);
export const getAllDaily = () => fetchData('/daily/');
export const getDaily = (maDaiLy) => fetchData(`/daily/${maDaiLy}`);
export const createDaily = (data) => fetchData('/daily/', 'POST', data);
export const updateDaily = (maDaiLy, data) => fetchData(`/daily/${maDaiLy}`, 'PUT', data);
export const deleteDaily = (maDaiLy) => fetchData(`/daily/${maDaiLy}`, 'DELETE');
export const getMonthlyRevenueReport = (data) => fetchData('/daily/mrr', 'POST', data);
export const searchDaiLy = (searchParams) => {
  const queryString = new URLSearchParams(searchParams).toString();
  return fetchData(`/daily/search?${queryString}`);
};

export const getAllQuan = () => fetchData('/quan/');
export const getQuan = (maQuan) => fetchData(`/quan/${maQuan}`);
export const createQuan = (data) => fetchData('/quan/', 'POST', data);
export const updateQuan = (maQuan, data) => fetchData(`/quan/${maQuan}`, 'PUT', data);
export const deleteQuan = (maQuan) => fetchData(`/quan/${maQuan}`, 'DELETE');

export const getAllLoaiDaiLy = () => fetchData('/loaidaily/');
export const getLoaiDaiLy = (maLoaiDaiLy) => fetchData(`/loaidaily/${maLoaiDaiLy}`);
export const createLoaiDaiLy = (data) => fetchData('/loaidaily/', 'POST', data);
export const updateLoaiDaiLy = (maLoaiDaiLy, data) => fetchData(`/loaidaily/${maLoaiDaiLy}`, 'PUT', data);
export const deleteLoaiDaiLy = (maLoaiDaiLy) => fetchData(`/loaidaily/${maLoaiDaiLy}`, 'DELETE');

// Add similar functions for other entities (donvitinh, loaidaily, etc.)
export const getAllDonViTinh = () => fetchData('/donvitinh/');
export const getDonViTinh = (maDonViTinh) => fetchData(`/donvitinh/${maDonViTinh}`);
export const createDonViTinh = (data) => fetchData('/donvitinh/', 'POST', data);
export const updateDonViTinh = (maDonViTinh, data) => fetchData(`/donvitinh/${maDonViTinh}`, 'PUT', data);
export const deleteDonViTinh = (maDonViTinh) => fetchData(`/donvitinh/${maDonViTinh}`, 'DELETE');

// Phieu Xuat
export const getAllPhieuXuat = () => fetchData('/phieuxuat/');
export const createPhieuXuat = (data) => fetchData('/phieuxuat/', 'POST', data);

// Phieu Thu
export const createPhieuThu = (data) => fetchData('/phieuthu/', 'POST', data);

// Mat Hang
export const getAllMatHang = () => fetchData('/mathang/');
export const getMatHang = (maMatHang) => fetchData(`/mathang/${maMatHang}`);
export const createMatHang = (data) => fetchData('/mathang/', 'POST', data);
export const updateMatHang = (maMatHang, data) => fetchData(`/mathang/${maMatHang}`, 'PUT', data);
export const deleteMatHang = (maMatHang) => fetchData(`/mathang/${maMatHang}`, 'DELETE');

export const getLatestMaDaiLy = () => fetchData('/id/madl');
export const getLatestMaDonViTinh = () => fetchData('/id/madvt');
export const getLatestMaLoaiDaiLy = () => fetchData('/id/maldl');
export const getLatestMaQuan = () => fetchData('/idmaphieuxuat/maquan');
export const getLatestMaMatHang = () => fetchData('/idmaphieuxuat/mamh');
export const getLatestMaPhieuThu = () => fetchData('/idmaphieuxuat/mapt');
export const getLatestMaPhieuXuat = () => fetchData('/idmaphieuxuat/mapx');

// Tham So
export const getLastThamSo = () => fetchData('/thamso/');
export const createThamSo = (data) => fetchData('/thamso/', 'POST', data);
export const updateThamSo = (data) => fetchData('/thamso/', 'PUT', data);
// src/dai-ly/handler.js

import DaiLyService from './services.mjs';

const daiLyService = new DaiLyService();

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

export const createdl = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const { tendaily, diachi, sodienthoai, email, maquan, maloaidaily, ngaytiepnhan } = JSON.parse(event.body);
        const maDaiLy = await daiLyService.createDaiLy({ tendaily, diachi, sodienthoai, email, maquan, maloaidaily, ngaytiepnhan });
        console.log('Đã tạo đại lý với ID:', maDaiLy);
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ message: 'Đã tạo đại lý thành công.', maDaiLy }),
        };
    } catch (error) {
        console.error('Lỗi khi tạo đại lý: ', error);
        return {
            statusCode: error.message.includes('required') ? 400 : 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi tạo đại lý: ', error: error.message }),
        };
    }
};

export const getalldl = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const DaiLy = await daiLyService.getAllDaiLy();
        if (!DaiLy) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: 'Không tìm thấy đại lý nào.' }),
            };
        }
        console.log('Tra cứu đại lý thành công:', JSON.stringify(DaiLy));
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(DaiLy),
        };
    } catch (error) {
        console.error('Lỗi khi tra cứu đại lý: ', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi tra cứu đại lý: ', error: error.message }),
        };
    }
};

export const getdlbyid = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const { maDaiLy } = event.pathParameters;
        const DaiLy = await daiLyService.getDaiLy(maDaiLy);
        if (!DaiLy) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: 'Không tìm thấy đại lý.' }),
            };
        }
        console.log('Tra cứu đại lý thành công:', DaiLy);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(DaiLy),
        };
    } catch (error) {
        console.error('Lỗi khi tra cứu đại lý: ', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi tra cứu đại lý: ', error: error.message }),
        };
    }
};

export const updatedl = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const { maDaiLy } = event.pathParameters;
        const { tendaily, diachi, sodienthoai, email, maquan, maloaidaily, ngaytiepnhan } = JSON.parse(event.body);
        await daiLyService.updateDaiLy(maDaiLy, { tendaily, diachi, sodienthoai, email, maquan, maloaidaily, ngaytiepnhan });
        console.log('Cập nhật đại lý thành công:', maDaiLy);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Cập nhật đại lý thành công.' }),
        };
    } catch (error) {
        console.error('Lỗi khi cập nhật đại lý: ', error);
        return {
            statusCode: error.message.includes('Không tìm thấy') ? 404 : 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi cập nhật đại lý: ', error: error.message }),
        };
    }
};

export const deletedl = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const { maDaiLy } = event.pathParameters;
        await daiLyService.deleteDaiLy(maDaiLy);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Xóa đại lý thành công.' }),
        };
    } catch (error) {
        console.error('Lỗi khi xóa đại lý: ', error);
        return {
            statusCode: error.message.includes('Không tìm thấy') ? 404 : 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi xóa đại lý: ', error: error.message }),
        };
    }
};

export const searchdl = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const searchParams = event.queryStringParameters || {};
        const results = await daiLyService.searchDaiLy(searchParams);
        
        if (!results || results.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Không tìm thấy đại lý nào phù hợp với tiêu chí tìm kiếm.', data: [] }),
            };
        }
        
        console.log('Tìm kiếm đại lý thành công, số kết quả:', results.length);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error('Lỗi khi tìm kiếm đại lý: ', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Lỗi khi tìm kiếm đại lý: ', error: error.message }),
        };
    }
};
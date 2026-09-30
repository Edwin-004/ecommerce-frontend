import axios from 'axios';
import { type CategoryRequestDto, type CategoryResponseDto, type PageResponse } from '../../types/category';

const API_BASE_URL = 'http://localhost:8080/api/backoffice/categories';

// Helper to attach authorization header
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const categoryApi = {
  // 1. Create Category
  createCategory: async (data: CategoryRequestDto): Promise<CategoryResponseDto> => {
    const res = await axios.post<CategoryResponseDto>(API_BASE_URL, data, { headers: getHeaders() });
    return res.data;
  },

  // 2. Get Flat List with Pagination
  getAllCategories: async (page = 0, size = 20, sort = 'categoryName'): Promise<PageResponse<CategoryResponseDto>> => {
    const res = await axios.get<PageResponse<CategoryResponseDto>>(
      `${API_BASE_URL}?page=${page}&size=${size}&sort=${sort}`,
      { headers: getHeaders() }
    );
    return res.data;
  },

  // 3. Get Nested Tree Hierarchy
  getCategoryTree: async (): Promise<CategoryResponseDto[]> => {
    const res = await axios.get<CategoryResponseDto[]>(`${API_BASE_URL}/tree`, { headers: getHeaders() });
    return res.data;
  },

  // 4. Get Single Category by ID
  getCategoryById: async (id: number): Promise<CategoryResponseDto> => {
    const res = await axios.get<CategoryResponseDto>(`${API_BASE_URL}/${id}`, { headers: getHeaders() });
    return res.data;
  },

  // 5. Update Category
  updateCategory: async (id: number, data: CategoryRequestDto): Promise<CategoryResponseDto> => {
    const res = await axios.put<CategoryResponseDto>(`${API_BASE_URL}/${id}`, data, { headers: getHeaders() });
    return res.data;
  },

  // 6. Delete Category
  deleteCategory: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`, { headers: getHeaders() });
  },
};
import api from "../../utils/axiosConfig";
import {
  type CategoryRequestDto,
  type CategoryResponseDto,
  type PageResponse,
} from "../../types/category";

// =========================================================
// CATEGORY API (Centered via axiosConfig)
// =========================================================

export const categoryApi = {
  // Create Category
  createCategory: async (
    data: CategoryRequestDto
  ): Promise<CategoryResponseDto> => {
    const response = await api.post<CategoryResponseDto>('/categories', data);
    return response.data;
  },

  // Get Flat Categories
  getAllCategories: async (
    page = 0,
    size = 20,
    sort = "categoryId,desc"
  ): Promise<PageResponse<CategoryResponseDto>> => {
    const response = await api.get<PageResponse<CategoryResponseDto>>('/categories', {
      params: {
        page,
        size,
        sort,
      },
    });
    return response.data;
  },

  // Get Category Tree
  getCategoryTree: async (): Promise<CategoryResponseDto[]> => {
    const response = await api.get<CategoryResponseDto[]>('/categories/tree');
    return response.data;
  },

  // Get Category by ID
  getCategoryById: async (
    id: number
  ): Promise<CategoryResponseDto> => {
    const response = await api.get<CategoryResponseDto>(`/categories/${id}`);
    return response.data;
  },

  // Update Category
  updateCategory: async (
    id: number,
    data: CategoryRequestDto
  ): Promise<CategoryResponseDto> => {
    const response = await api.put<CategoryResponseDto>(`/categories/${id}`, data);
    return response.data;
  },

  // Delete Category
  deleteCategory: async (
    id: number
  ): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

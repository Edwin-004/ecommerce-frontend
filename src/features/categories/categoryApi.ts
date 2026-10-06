
import axios from "axios";

import {
  type  CategoryRequestDto,
  type CategoryResponseDto,
  type PageResponse,
} from "../../types/category";

const API_BASE_URL =
  "http://localhost:8080/api/backoffice/categories";

// =========================================================
// AUTHORIZATION HEADER
// =========================================================

const getHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// =========================================================
// CATEGORY API
// =========================================================

export const categoryApi = {
  // Create Category
  createCategory: async (
    data: CategoryRequestDto
  ): Promise<CategoryResponseDto> => {
    const response =
      await axios.post<CategoryResponseDto>(
        API_BASE_URL,
        data,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  // Get Flat Categories
  getAllCategories: async (
    page = 0,
    size = 20,
    sort = "categoryName"
  ): Promise<
    PageResponse<CategoryResponseDto>
  > => {
    const response =
      await axios.get<
        PageResponse<CategoryResponseDto>
      >(API_BASE_URL, {
        params: {
          page,
          size,
          sort,
        },
        headers: getHeaders(),
      });

    return response.data;
  },

  // Get Category Tree
  getCategoryTree: async (): Promise<
    CategoryResponseDto[]
  > => {
    const response =
      await axios.get<
        CategoryResponseDto[]
      >(`${API_BASE_URL}/tree`, {
        headers: getHeaders(),
      });

    return response.data;
  },

  // Get Category by ID
  getCategoryById: async (
    id: number
  ): Promise<CategoryResponseDto> => {
    const response =
      await axios.get<CategoryResponseDto>(
        `${API_BASE_URL}/${id}`,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  // Update Category
  updateCategory: async (
    id: number,
    data: CategoryRequestDto
  ): Promise<CategoryResponseDto> => {
    const response =
      await axios.put<CategoryResponseDto>(
        `${API_BASE_URL}/${id}`,
        data,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  // Delete Category
  deleteCategory: async (
    id: number
  ): Promise<void> => {
    await axios.delete(
      `${API_BASE_URL}/${id}`,
      {
        headers: getHeaders(),
      }
    );
  },
};


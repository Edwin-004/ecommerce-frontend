import axios from "axios";

import type {
  TagRequestDto,
  TagResponseDto,
  PageResponse,
} from "../../types/tag";

const API_BASE_URL =
  "http://localhost:8080/api/backoffice/tags";

const getHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const tagApi = {
  getAllTags: async (
    page = 0,
    size = 10,
    sort = "tagName,asc",
    search = ""
  ): Promise<PageResponse<TagResponseDto>> => {

    const response =
      await axios.get<PageResponse<TagResponseDto>>(
        API_BASE_URL,
        {
          params: {
            page,
            size,
            sort,
            search: search.trim() || undefined,
          },
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  getTagById: async (
    id: number
  ): Promise<TagResponseDto> => {

    const response =
      await axios.get<TagResponseDto>(
        `${API_BASE_URL}/${id}`,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  createTag: async (
    data: TagRequestDto
  ): Promise<TagResponseDto> => {

    const response =
      await axios.post<TagResponseDto>(
        API_BASE_URL,
        data,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  updateTag: async (
    id: number,
    data: TagRequestDto
  ): Promise<TagResponseDto> => {

    const response =
      await axios.put<TagResponseDto>(
        `${API_BASE_URL}/${id}`,
        data,
        {
          headers: getHeaders(),
        }
      );

    return response.data;
  },

  deleteTag: async (
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
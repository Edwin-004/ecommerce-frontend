import api from "../../utils/axiosConfig";
import type {
  TagRequestDto,
  TagResponseDto,
  PageResponse,
} from "../../types/tag";

// =========================================================
// TAG API (Centered via axiosConfig)
// =========================================================

export const tagApi = {
  getAllTags: async (
    page = 0,
    size = 10,
    sort = "tagName,asc",
    search = ""
  ): Promise<PageResponse<TagResponseDto>> => {
    const response = await api.get<PageResponse<TagResponseDto>>('/tags', {
      params: {
        page,
        size,
        sort,
        search: search.trim() || undefined,
      },
    });
    return response.data;
  },

  getTagById: async (
    id: number
  ): Promise<TagResponseDto> => {
    const response = await api.get<TagResponseDto>(`/tags/${id}`);
    return response.data;
  },

  createTag: async (
    data: TagRequestDto
  ): Promise<TagResponseDto> => {
    const response = await api.post<TagResponseDto>('/tags', data);
    return response.data;
  },

  updateTag: async (
    id: number,
    data: TagRequestDto
  ): Promise<TagResponseDto> => {
    const response = await api.put<TagResponseDto>(`/tags/${id}`, data);
    return response.data;
  },

  deleteTag: async (
    id: number
  ): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
};

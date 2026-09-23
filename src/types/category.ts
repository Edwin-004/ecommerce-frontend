export interface CategoryRequestDto {
  categoryName: string;
  description?: string;
  parentId?: number | null;
  userId: number;
}

export interface CategoryResponseDto {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentId?: number | null;
  parentName?: string | null;
  children?: CategoryResponseDto[];
  createdByUserId?: number;
  createdAt?: string;
  modifiedByUserId?: number;
  modifiedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
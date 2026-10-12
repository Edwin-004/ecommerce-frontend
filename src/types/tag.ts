export interface TagRequestDto {
  tagName: string;
}

export interface TagResponseDto {
  tagId: number;
  tagName: string;

  createdAt: string;
  createdBy?: number;
  createdByName?: string;

  modifiedAt?: string | null;
  modifiedBy?: number | null;
  modifiedByName?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
export interface InfiniteResponse<T> {
  total: number;
  data: T[];
  nextCursor: number | undefined;
  prevCursor: number | undefined;
}

export interface CountResponse {
  count: number;
  // message: string;
}

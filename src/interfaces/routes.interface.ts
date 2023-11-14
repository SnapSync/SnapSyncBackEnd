import { Router } from 'express';

export interface Routes {
  path?: string;
  router: Router;
}

export interface RoutePagination {
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

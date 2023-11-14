import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import SearchesController from '@/controllers/searches.controller';

class SearchesRoute implements Routes {
  public path = '/searches';
  public router = Router();
  public searchesController = new SearchesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
  }
}

export default SearchesRoute;

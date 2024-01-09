import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import SearchesController from '@/controllers/searches.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class SearchesRoute implements Routes {
  public path = '/searches';
  public router = Router();
  public seachesController = new SearchesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/search`, authMiddleware, this.seachesController.search);
    this.router.get(`${this.path}/search/preview`, authMiddleware, this.seachesController.searchPreview);
  }
}

export default SearchesRoute;

import CountriesController from '@/controllers/countries.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';

class CountriesRoute implements Routes {
  public path = '/countries';
  public router = Router();
  public countriesController = new CountriesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.countriesController.getCountries);
  }
}

export default CountriesRoute;

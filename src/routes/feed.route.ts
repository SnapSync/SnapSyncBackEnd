import FeedController from "@/controllers/feed.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

class FeedRoute implements Routes {
    public path = '/feed';
    public router = Router();
    public feedController = new FeedController();

    constructor() {
      this.initializeRoutes();
    }
  
    private initializeRoutes() {}
}

export default FeedRoute;
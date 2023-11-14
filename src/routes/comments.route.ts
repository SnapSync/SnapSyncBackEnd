import CommentsController from "@/controllers/comments.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

class CommentsRoute implements Routes {
    public path = '/comments';
    public router = Router();
    public commentsController = new CommentsController();

    constructor() {
      this.initializeRoutes();
    }
  
    private initializeRoutes() {}
}

export default CommentsRoute;
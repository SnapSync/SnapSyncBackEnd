import AccountsController from "@/controllers/accounts.controller";
import { Routes } from "@/interfaces/routes.interface";
import { Router } from "express";

class AccountsRoute implements Routes {
    public path = '/accounts';
    public router = Router();
    public accountsController = new AccountsController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/username/rules`, this.accountsController.getUsernameRules);
        this.router.get(`${this.path}/full_name/rules`, this.accountsController.getFullNameRules);
        this.router.get(`${this.path}/bio/rules`, this.accountsController.getBioRules);
    }
}

export default AccountsRoute;
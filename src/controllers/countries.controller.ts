import CountryService from "@/services/countries.service";
import { retrivePaginationParamFromRequest } from "@/utils/util";
import { NextFunction, Request, Response } from "express";

class CountriesController {
    public countryService = new CountryService();

    public getCountries = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const p = retrivePaginationParamFromRequest(req);

            const r = await this.countryService.findCountries(p.page, p.size);

            res.status(200).json({...r});
        } catch (error) {
            next(error);
        }
    }
}

export default CountriesController;
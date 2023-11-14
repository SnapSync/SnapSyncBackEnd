import { HttpException } from '@/exceptions/HttpException';
import { ApiCountry } from '@/interfaces/countries.interface';
import { RoutePagination } from '@/interfaces/routes.interface';
import { Countries } from '@/models/countries.model';
import AwsService from './aws.service';
import { SnapSyncErrorType } from '@/utils/enum';

class CountryService {
  public async findCountries(
    page?: number,
    size?: number,
  ): Promise<{
    countries: ApiCountry[];
    pagination: RoutePagination;
  }> {
    const countries: ApiCountry[] = [];
    const pagination: RoutePagination = {
      page: 0,
      size: 0,
      total: 0,
      hasMore: false,
    };

    const prmPage = page && page > 0 ? page : 1;
    const prmSize = size && size > 0 ? size : 30;

    const results = await Countries.query()
      .whereNotDeleted()
      .page(prmPage - 1, prmSize);

    for (const country of results.results) {
      const ap = await this.findApiCountryById(country.id);
      countries.push(ap);
    }

    pagination.page = prmPage;
    pagination.size = prmSize;
    pagination.total = results.total;
    pagination.hasMore = prmPage * prmSize < results.total;

    return {
      countries,
      pagination,
    };
  }

  public async findApiCountryById(id: number): Promise<ApiCountry> {
    const findOne = await Countries.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.country_not_found', 'Country not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    const flagUrl: string | null = findOne.flagS3Key ? await new AwsService().getSignedUrl(findOne.flagS3Key) : null;

    return {
      id: findOne.id,
      iso: findOne.iso,
      name: findOne.name,
      nicename: findOne.nicename,
      iso3: findOne.iso3,
      numCode: findOne.numCode,
      phoneCode: findOne.phoneCode,

      flagUrl: flagUrl,
    };
  }
}

export default CountryService;

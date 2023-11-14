import request from 'supertest';
import App from '../app'
import CountryRoute from '../routes/countries.route';

afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Countries', () => {
  describe('[GET] /countries', () => {
    it('La risposta dovrebbe contenere le regole per il campo FullName', () => {
      const route = new CountryRoute();
      const app = new App([route]);
      return request(app.getServer()).get(`${route.path}`).expect(200);
    });
  });
});

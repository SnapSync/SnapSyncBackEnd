import request from 'supertest';
import App from '../app'
import AccountRoute from '../routes/accounts.route'

afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Accounts', () => {
  describe('[GET] /full_name/rules', () => {
    it('La risposta dovrebbe contenere le regole per il campo FullName', () => {
      const route = new AccountRoute();
      const app = new App([route]);
      return request(app.getServer()).get(`${route.path}/full_name/rules`).expect(200);
    });
  });

  describe('[GET] /username/rules', () => {
    it('La risposta dovrebbe contenere le regole per il campo Username', () => {
      const route = new AccountRoute();
      const app = new App([route]);
      return request(app.getServer()).get(`${route.path}/username/rules`).expect(200);
    });
  });

  describe('[GET] /bio/rules', () => {
    it('La risposta dovrebbe contenere le regole per il campo Biography', () => {
      const route = new AccountRoute();
      const app = new App([route]);
      return request(app.getServer()).get(`${route.path}/bio/rules`).expect(200);
    });
  });
});

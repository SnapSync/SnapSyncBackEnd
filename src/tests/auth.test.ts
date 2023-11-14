import request from 'supertest';
import App from '../app';
import AuthRoute from '../routes/auth.route';
import DeviceRoute from '../routes/devices.route';
import { LogInResponse } from '../interfaces/auth.interface';

afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

describe('Testing Auth', () => {
  let sessionId: string | null = null;
  let deviceUuid: string | null = null;
  let tokenApi: string | null = null;

  beforeAll(async () => {
    const authRoute = new AuthRoute();
    const deviceRoute = new DeviceRoute();
    const app = new App([authRoute, deviceRoute]);

    // Eseguire una richiesta per ottenere il SessionId
    const response = await request(app.getServer()).get(`${authRoute.path}/get_session_id`).expect(200);

    // Eseguire una richiesta per ottenere il deviceUuid
    const response2 = await request(app.getServer()).post(`${authRoute.path}/register`).send({ platformOs: 'ios' }).expect(201);

    // Estrai il SessionId dalla risposta
    sessionId = response.body.sessionId;
    deviceUuid = response2.body.device.uuid;
  });

  // FULLNAME
  describe('[POST] /fullname', () => {
    it('La risposta dovrebbe essere un 422 poi il fullName non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        fullname: 'Matteo Urso 2',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/fullname`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /fullname', () => {
    it('La risposta dovrebbe essere un 422 poi il fullName non è valido (troppo lungo)', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        fullname:
          'Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso Matteo Urso',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/fullname`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /fullname', () => {
    it('La risposta dovrebbe essere un 422 poi il fullName non è valido (troppo corso)', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        fullname: 'Ma',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/fullname`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /fullname', () => {
    it('La risposta dovrebbe essere un 200 se il fullName è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        fullname: 'Mario Rossi',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/fullname`).set(header).send(body).expect(200);
    });
  });

  // DATE OF BIRTH
  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 422 poi il yearOfBirth non è valido', () => {
      // Verifico se il SessionId è stato ottenuto
      expect(sessionId).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // yearOfBirth non valido
      const body = {
        yearOfBirth: new Date().getFullYear() + 1,
        monthOfBirth: 11,
        dayOfBirth: 25,
        sessionId: sessionId,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).send(body).expect(422);
    });
  });

  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 422 poi il yearOfBirth non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // monthOfBirth non valido
      const body = {
        yearOfBirth: 1899,
        monthOfBirth: 12,
        dayOfBirth: 25,
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 422 poi il monthOfBirth non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // dayOfBirth non valido
      const body = {
        yearOfBirth: 2002,
        monthOfBirth: 13,
        dayOfBirth: 12,
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 422 poi il dayOfBirth non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // dayOfBirth non valido
      const body = {
        yearOfBirth: 2002,
        monthOfBirth: 12,
        dayOfBirth: 32,
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 422 poi troppo piccolo', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // dayOfBirth non valido
      const body = {
        yearOfBirth: new Date().getFullYear() - 12,
        monthOfBirth: new Date().getMonth() + 1,
        dayOfBirth: new Date().getDate(),
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /date_of_birth', () => {
    it('La risposta dovrebbe essere un 200 se il DateOfBirth è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // dayOfBirth non valido
      const body = {
        yearOfBirth: 2002,
        monthOfBirth: 11,
        dayOfBirth: 25,
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/date_of_birth`).set(header).send(body).expect(200);
    });
  });

  // PHONE NUMBER
  describe('[POST] /phone_number', () => {
    it('La risposta dovrebbe essere un 422 poi il phoneNumber non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        phoneNumber: 'cioa',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/phone_number`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /phone_number', () => {
    it('La risposta dovrebbe essere un 200 se il PhoneNumber è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        phoneNumber: '+393472625127',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/phone_number`).send(body).expect(200);
    });
  });

  // OTP
  describe('[POST] /otp', () => {
    it('La risposta dovrebbe essere un 400 poi il otp non è valido', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        otp: '111111',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/otp`).set(header).send(body).expect(400);
    });
  });

  describe('[POST] /otp', () => {
    it('La risposta dovrebbe essere un 200', () => {
      // Verifico se il SessionId e il deviceUuid sono stati ottenuti
      expect(sessionId).not.toBeNull();
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        otp: '123456',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      // Se nella risposta goNext = false, significa che un utente con quel numero di telefono è già registrato, perciò il backend mi torna un TokenData
      request(app.getServer())
        .post(`${authRoute.path}/otp`)
        .set(header)
        .send(body)
        .expect(200)
        .then(response => {
          if (response.body.goNext === false) {
            let lg: LogInResponse = response.body.data;
            tokenApi = lg.tokenData.token;
          }
        });
    });
  });

  // USERNAME
  describe('[POST] /username', () => {
    it('La risposta dovrebbe essere un 422 poi il username non è valido (troppo corto)', () => {
      // Verifico se il SessionId è stato ottenuto
      expect(sessionId).not.toBeNull();
      expect(tokenApi).toBeNull(); // Se il tokenApi non è null, significa che l'utente è già registrato
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // username non valido
      const body = {
        username: 'a',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/username`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /username', () => {
    it('La risposta dovrebbe essere un 422 poi il username non è valido (troppo lungo)', () => {
      expect(sessionId).not.toBeNull();
      expect(tokenApi).toBeNull(); // Se il tokenApi non è null, significa che l'utente è già registrato
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // username non valido
      const body = {
        username: 'matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo matteo',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/username`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /username', () => {
    it('La risposta dovrebbe essere un 422 poi il username non è valido (Gia preso)', () => {
      expect(sessionId).not.toBeNull();
      expect(tokenApi).toBeNull(); // Se il tokenApi non è null, significa che l'utente è già registrato
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // username non valido
      const body = {
        username: 'ufo',
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/username`).set(header).send(body).expect(422);
    });
  });

  describe('[POST] /username', () => {
    it('La risposta dovrebbe essere un 200 se il username è valido', () => {
      // Verifico se il SessionId è stato ottenuto
      expect(sessionId).not.toBeNull();
      expect(tokenApi).toBeNull(); // Se il tokenApi non è null, significa che l'utente è già registrato

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      // username non valido
      const body = {
        username: `test_${Math.floor(Math.random() * 1000) + 1}`,
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/username`).set(header).send(body).expect(200);
    });
  });

  // SIGNUP
  describe('[POST] /signup', () => {
    it('La risposta dovrebbe essere un 200', () => {
      // Verifico se il SessionId è stato ottenuto
      expect(sessionId).not.toBeNull();
      expect(tokenApi).toBeNull(); // Se il tokenApi non è null, significa che l'utente è già registrato
      expect(deviceUuid).not.toBeNull();

      const authRoute = new AuthRoute();
      const app = new App([authRoute]);

      const body = {
        sessionId: sessionId,
      };

      const header = {
        DeviceUuid: deviceUuid,
      };

      return request(app.getServer()).post(`${authRoute.path}/signup`).set(header).send(body).expect(200);
    });
  });
});

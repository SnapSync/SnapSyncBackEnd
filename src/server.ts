import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import validateEnv from '@utils/validateEnv';
import DevicesRoute from './routes/devices.route';
import FriendshipsRoute from './routes/friendships.route';
import AccountsRoute from './routes/accounts.route';
import SearchesRoute from './routes/searches.route';
import SettingsRoute from './routes/settings.route';

validateEnv();

const app = new App([
  new IndexRoute(),
  new UsersRoute(),
  new AuthRoute(),
  new DevicesRoute(),
  new FriendshipsRoute(),
  new AccountsRoute(),
  new SearchesRoute(),
  new SettingsRoute(),
]);

app.listen();

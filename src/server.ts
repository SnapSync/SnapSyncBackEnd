import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import validateEnv from '@utils/validateEnv';
import AccountsRoute from './routes/accounts.route';
import CommentsRoute from './routes/comments.route';
import FeedRoute from './routes/feed.route';
import FriendshipsRoute from './routes/friendships.route';
import NotificationsRoute from './routes/notifications.route';
import SearchesRoute from './routes/searches.route';
import SnapsSyncRoute from './routes/snaps_sync.route';
import CountriesRoute from './routes/countries.route';
import DevicesRoute from './routes/devices.route';

validateEnv();

const app = new App([
    new IndexRoute(), 
    new UsersRoute(), 
    new CountriesRoute(),
    new AuthRoute(),
    new AccountsRoute(),
    new CommentsRoute(),
    new FeedRoute(),
    new FriendshipsRoute(),
    new NotificationsRoute(),
    new SearchesRoute(),
    new SnapsSyncRoute(),
    new DevicesRoute(),
]);

app.listen();

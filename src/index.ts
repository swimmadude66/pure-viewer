import {ConfigService} from './services/config';
import {GithubService} from './services/github';

const configService: ConfigService = new ConfigService();
const github: GithubService = new GithubService(configService);


github.getPRsForUsers(['swimmadude66', 'jcdelmas'])
.subscribe(
    user => console.log(JSON.stringify(user, null, 2)),
    err => console.error(err)
);

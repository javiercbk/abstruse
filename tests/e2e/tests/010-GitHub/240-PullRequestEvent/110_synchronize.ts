import { synchronize, header } from '../../../webhooks/github/PullRequestEvent';
import { sendRequest } from '../../../utils/utils';

export default function() {
  return Promise.resolve()
    .then(() => sendRequest(synchronize, header))
    .then(resp => resp.msg === 'ok' ? Promise.resolve() : Promise.reject(resp))
    .catch(err => Promise.reject(err));
}

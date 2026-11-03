import {createApiClient} from '../../shared/apiClient.ts';
/** Only for explicitly public work snapshots; the server still checks the reference. */
export function loadPublicImage(url:string,signal?:AbortSignal){return createApiClient({getAccessToken:async()=>null}).image(url,signal);}

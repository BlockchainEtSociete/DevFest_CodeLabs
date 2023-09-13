import { CID, create } from 'ipfs-http-client'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import all from 'it-all'

const credentials = import.meta.env.VITE_IPFS_CREDENTIALS;

const requestHeaders: any = {};

if (credentials) {
    requestHeaders.authorization = 'Basic ' + btoa(credentials);
}

const ipfs = create({
    host: import.meta.env.VITE_API_IPFS_HOST ?? 'localhost',
    port: parseInt(import.meta.env.VITE_API_IPFS_PORT ?? '5001'),
    protocol: import.meta.env.VITE_API_IPFS_SCHEME ?? 'http',
    headers: requestHeaders,
});

export const ipfsGetContent = async (tokenUri: string) => {
    const cid = tokenUri.replace('ipfs://', '')
    return uint8ArrayConcat(await all(ipfs.cat(CID.parse(cid))))
}

export const ipfsGetUrl = (uri: string) => {
    const cid = uri.replace('ipfs://', '')
    return `${import.meta.env.VITE_IPFS_GATEWAY_SCHEME??'https'}://${import.meta.env.VITE_IPFS_GATEWAY_HOST??'ipfs.io'}:${import.meta.env.VITE_IPFS_GATEWAY_PORT??443}/ipfs/${cid}`
}

export default ipfs;

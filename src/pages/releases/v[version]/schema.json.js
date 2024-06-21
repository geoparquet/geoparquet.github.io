import {releases} from '../../../releases.js';

export async function getStaticPaths() {
  return (await releases).map(r => ({params: {version: r.version}}));
}

export async function GET({params}) {
  const version = params.version;
  const release = (await releases).find(r => r.version === version);
  if (!release) {
    return new Response('Not found', {status: 404});
  }
  return new Response(JSON.stringify(release.schema));
}

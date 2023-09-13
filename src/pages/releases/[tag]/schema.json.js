import {releases} from '../../../releases.js';

export async function getStaticPaths() {
  return (await releases).map(r => ({params: {tag: r.tag}}));
}

export async function GET({params}) {
  const tag = params.tag;
  const release = (await releases).find(r => r.tag === tag);
  if (!release) {
    return new Response('Not found', {status: 404});
  }
  return new Response(JSON.stringify(release.schema));
}

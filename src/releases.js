import semver from 'semver';
import {Octokit} from '@octokit/rest';
import {retry} from '@octokit/plugin-retry';

const OctokitClient = Octokit.plugin(retry);

const owner = 'opengeospatial';
const repo = 'geoparquet';

const earliestRelease = 'v0.2.0';

const defaultContentUrl = `https://raw.githubusercontent.com/${owner}/${repo}`;
const defaultSchemaPath = 'format-specs/schema.json';
const defaultSpecPath = 'format-specs/geoparquet.md';

const altPaths = {
  'v0.3.0': {schemaPath: 'validator/python/geoparquet_validator/schema.json'},
  'v0.2.0': {schemaPath: 'validator/python/geoparquet_validator/schema.json'},
};

/**
 * @return {Promise<Array<string>>} Release tags sorted latest first.
 */
async function getReleaseTags() {
  process.removeAllListeners('warning');
  const client = new OctokitClient({
    auth: process.env.GITHUB_TOKEN,
  });

  const tags = await client.paginate(
    client.rest.repos.listReleases,
    {owner, repo},
    response => response.data.map(release => release['tag_name'])
  );

  return tags
    .filter(tag => semver.valid(tag) && semver.gte(tag, earliestRelease))
    .sort((a, b) => (semver.gt(a, b) ? -1 : 1));
}

async function getSchema(tag) {
  const schemaPath = altPaths[tag]?.schemaPath || defaultSchemaPath;
  const url = `${defaultContentUrl}/${tag}/${schemaPath}`;
  const response = await fetch(url);
  return response.json();
}

async function getSpec(tag) {
  const specPath = altPaths[tag]?.specPath || defaultSpecPath;
  const url = `${defaultContentUrl}/${tag}/${specPath}`;
  const response = await fetch(url);
  let spec = await response.text();

  // TODO: remove this after 1.0.0-beta.1 is no longer included
  spec = spec.replace('* [Examples](../examples/)', '');

  return spec;
}

/**
 * @typedef {Object} Release
 * @property {string} tag The git tag.
 * @property {Object} schema The JSON schema.
 * @property {string} spec The contents of the spec document.
 * @property {string} version The clean version, ignoring build metadata (e.g. if the tag is v1.1.0+p1, the version is 1.1.0).
 */

/**
 * @param {string} tag The release tag (e.g. 'v1.2.3').
 * @return {Promise<Release>} Release info.
 */
async function getReleaseInfo(tag) {
  const [schema, spec] = await Promise.all([getSchema(tag), getSpec(tag)]);
  const version = semver.clean(tag);
  return {tag, schema, spec, version};
}

/**
 * @return {Promise<Array<Release>>} Release info sorted latest first.
 */
async function getReleases() {
  const allTags = await getReleaseTags();
  const tags = [];
  let previousVersion = '';
  for (const tag of allTags) {
    const version = semver.clean(tag);
    if (version === previousVersion) {
      continue;
    }
    previousVersion = version;
    tags.push(tag);
  }
  return Promise.all(tags.map(tag => getReleaseInfo(tag)));
}

export const releases = getReleases();

import config from 'eslint-config-planet';

/**
 * @type {Array<import("eslint").Linter.Config>}
 */
export default [
  ...config,
  {
    rules: {
      'import/no-unresolved': [
        'error',
        {
          ignore: ['@octokit/rest'],
        },
      ],
    },
  },
];

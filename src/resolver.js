import Http from './http'
import mapSpec, {plugins} from './specmap'
import {normalizeSwagger} from './helpers'

export function makeFetchJSON(http) {
  return (docPath) => {
    return http({
      url: docPath,
      headers: {
        Accept: 'application/json'
      }
    })
    .then(res => res.body)
  }
}

// Wipe out the http cache
export function clearCache() {
  plugins.refs.clearCache()
}

export default function resolve({http, fetch, spec, url, mode, allowMetaPatches = true}) {
  // Provide a default fetch implementation
  // TODO fetch should be removed, and http used instead
  http = fetch || http || Http

  if (!spec) {
    // We create a spec, that has a single $ref to the url
    // This is how we'll resolve it based on a URL only
    spec = {$ref: url}
  }
  else {
    // Store the spec into the url provided, to cache it
    plugins.refs.docCache[url] = spec
  }

  // Build a json-fetcher ( ie: give it a URL and get json out )
  plugins.refs.fetchJSON = makeFetchJSON(http)

  const plugs = [plugins.refs]

  if (mode !== 'strict') {
    plugs.push(plugins.allOf)
  }

  // mapSpec is where the hard work happens, see https://github.com/swagger-api/specmap for more details
  return mapSpec({
    spec,
    context: {baseDoc: url},
    plugins: plugs,
    allowMetaPatches // allows adding .meta patches, which include adding `$$ref`s to the spec
  }).then(normalizeSwagger)
}

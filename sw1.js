const addResourcesToCache = async (resources) => {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
};

const enableNavigationPreload = () => {
  if (self.registration.navigationPreload)
    self.registration.navigationPreload.enable();
};

const putInCache = async (request, response) => {
  const cache = await caches.open('v1');
  cache.put(request, response);
};

const deleteOldCache = async () => {
  const allowedCachedKeys = ['v1'];
  const keyList = await caches.keys();
  return Promise.all(
    keyList.map((key) => {
      if (!allowedCachedKeys.includes(key)) {
        return caches.delete(key);
      }
    })
  );
};

const cacheFirst = async (request, preloadResponsePromise, fallbackURL) => {
  // try to get it from cache first
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  // Next try to use preloadResponse, if it's there
  const preloadResponse = await preloadResponsePromise();
  if (preloadResponse) {
    await putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to fetch from the network
  try {
    const responseFromNetwork = await fetch(request);
    await putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch {
    const fallbackResponse = await caches.match(fallbackURL);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-type': 'text/plain' },
    });
  }
};

self.addEventListener('install', () => {
  console.log("fuck")
  self.waitUntil(
    addResourcesToCache([
      '/gallery/bountyHunters.jpg',
      '/gallery/myLittleVader.jpg',
      '/gallery/snowTroopers.jpg',
    ])
  );
});

self.addEventListener('activate', (event) => {
  self.waitUntil(deleteOldCache());
});

self.addEventListener('fetch', (event) => {
  console.log('get fetchhhh');
  event.respondWith(
    cacheFirst(event.request, event.preloadResponse, '/gallery/404.jpg')
  );
});

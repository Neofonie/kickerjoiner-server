# kickerjoiner-server

- json storage server
  - https://kij.willy-selma.de/db
  - GET ?_sort=d&_order=desc
  - POST (create): return new id
  - PUT (override) with /id
  - PATCH (update single nodes in object) with /id
```
return await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());
```
- websocket
-- wss://kij.willy-selma.de

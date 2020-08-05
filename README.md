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
-- wss://kij.willy-selma.de/ws
```

```

## development

### bake it to an executable binary

Build a linux64 binary: `kicker-server-linux64`
````bash
npm run build
````

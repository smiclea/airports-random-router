# Update the airports DB from Little Navmap

## 1. Create the airports and approaches collection from Little Navmap

Set the Little Navmap DB path

```bash
SQLITE_DB_PATH='[..]\little_navmap_navigraph.sqlite'
```

Run `yarn build-database`

## 2. Create GeoJSON Data

Run `yarn transform-airports`

# Manually update the airports DB from Little Navmap

Read [this](../../buildDatabase/README.md) for automatic update.

## Prepare SQL Lite DB

* Download Little Nav Map from [github](https://github.com/albar965/littlenavmap/releases)

* Make sure navigraph is up to date in little nav map, using the navigraph addon update tool.

* Go to Tools -> Files and Directories -> Show Database Files

* Copy 'little_navmap_navigraph.sqlite'

* Download [SQLite Tools](https://www.sqlite.org/download.html)

## Import Airports

* Run:

```sql
.\sqlite3.exe .\little_navmap_navigraph.sqlite

.headers on

.mode csv

.output airports.csv

SELECT airport_id, ident, name, city, lonx, laty, altitude, longest_runway_length FROM airport;
```

* Copy 'airports.csv'

* Download [MongoDB Tools](https://www.mongodb.com/try/download/database-tools)

* Run: `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection airports --type csv --headerline --file airports.csv`

## Import Approaches

* Run:

```sql
.\sqlite3.exe .\little_navmap_navigraph.sqlite

.headers on

.mode csv

.output approaches.csv

SELECT airport_id, type FROM approach GROUP BY airport_id, type;
```

* Copy 'approaches.csv'

* Run: `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection approaches --type csv --headerline --file approaches.csv`

## Create GeoJSON Data

* Run `yarn transform-airports`

## Import Runways (deprecated step)

* Run:

```sql
.\sqlite3.exe .\little_navmap_navigraph.sqlite

.headers on

.mode csv

.output runways.csv

SELECT runway_id, airport_id, length, heading, primary_lonx, primary_laty, secondary_lonx, secondary_laty, altitude, lonx, laty FROM runway;
```

* Copy 'runways.csv'

* Drop the old 'runways' collection

* Run: `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection runways --type csv --headerline --file runways.csv`

* Create indexes: airport_id, runway_id

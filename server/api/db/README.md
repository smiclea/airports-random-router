# Update the airports DB from MSFS DB

## Prepare SQL Lite DB

* Download Little Nav Map from [github](https://github.com/albar965/littlenavmap/releases)

* If not automatically prompted, go to Scenery Library -> Load Scenery Library and load the MSFS base packages.

* Go to Tools -> Files and Directories -> Show Database Files

* Copy 'little_navmap_msfs.sqlite'

* Download [SQLite Tools](https://www.sqlite.org/download.html)

## Import Airports

* Run:

```sql
.\sqlite3.exe .\little_navmap_msfs.sqlite

.headers on

.mode csv

.output airports.csv

SELECT airport_id, ident, name, city, lonx, laty, altitude, longest_runway_length FROM airport;
```

* Copy 'airports.csv'

* Download [MongoDB Tools](https://www.mongodb.com/try/download/database-tools)

* Drop the old 'airports' collection

* Run: `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection airports --type csv --headerline --file airports.csv`

* The indexes for `airports` collection are created in the last step (`yarn transform-airports`)

## Import Runways

* Run:

```sql
.\sqlite3.exe .\little_navmap_msfs.sqlite

.headers on

.mode csv

.output runways.csv

SELECT runway_id, airport_id, length, heading, primary_lonx, primary_laty, secondary_lonx, secondary_laty, altitude, lonx, laty FROM runway;
```

* Copy 'runways.csv'

* Drop the old 'runways' collection

* Run: `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection runways --type csv --headerline --file runways.csv`

* Create indexes: airport_id, runway_id

## Create GeoJSON Data

* Run `yarn transform-airports`

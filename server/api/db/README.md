# Update the airports DB from MSFS DB

1. Download Little Nav Map from [github](https://github.com/albar965/littlenavmap/releases)

2. If not automatically prompted, go to Scenery Library -> Load Scenery Library and load the MSFS base packages.

3. Go to Tools -> Files and Directories -> Show Database Files

4. Copy 'little_navmap_msfs.sqlite'

5. Download [SQLite Tools](https://www.sqlite.org/download.html)

6. Run:

* `.\sqlite3.exe .\little_navmap_msfs.sqlite`

* `.headers on`

* `.mode csv`

* `.output airports.csv`

* `SELECT airport_id, ident, name, lonx, laty, altitude, longest_runway_length FROM airport;`

7. Copy 'airports.csv'

8. Download [MongoDB Tools](https://www.mongodb.com/try/download/database-tools)

9. Drop the old 'airports' collection

10. Run:

* `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection airports --type csv --headerline --file airports.csv`

11. Create index for 'ident', 'airport_id' fields

12. For `runways` collection do the same except:

* `SELECT runway_id, airport_id, length, heading, primary_lonx, primary_laty, secondary_lonx, secondary_laty, altitude, lonx, laty FROM runway;`

* `./mongoimport.exe --uri mongodb+srv://smiclea:<PASSWORD>@cluster0.uijew.mongodb.net/airports --collection runways --type csv --headerline --file runways.csv`

* indexes: airport_id, runway_id

13. Run `yarn transform-airports`

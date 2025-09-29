# Manual API checks for postgresql db to be ran in bash

```bash
# Empty watchlist => tickers array should be [] and limit 10
curl http://localhost:5000/api/watchlist

# Add AAPL => expect 201 status (if using curl -i) and tickers ["AAPL"]
curl -X POST http://localhost:5000/api/watchlist/items \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL"}'

# Duplicate add => expect 409 status and error message about duplicate ticker
curl -i -X POST http://localhost:5000/api/watchlist/items \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL"}'

# Remove AAPL => expect tickers [] (empty again)
curl -X DELETE http://localhost:5000/api/watchlist/items/AAPL

# Remove missing ticker => expect 404 status and error message
curl -i -X DELETE http://localhost:5000/api/watchlist/items/AAPL

# Valid search => expect results array with AAPL variants, cached false on first call
curl "http://localhost:5000/api/search?q=AAPL"

# Invalid search => expect 400 status and validation error message
curl -i "http://localhost:5000/api/search?q=??"

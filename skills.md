# MileStone 1: 
    1. created client(react) and server(express);
    2. server (in js);
    3. express, cors, dotenv and app creation
    4. dotenv -> fetching config from env
    5. using cors as middleware
    6. creation of app
    7. checking health endpoints
    8. running server which fetching port from env;

# Milestone 2:
    1. creating scripts folder and fetchCF file
    2. in fetchcf:
    3. fetching data using fetch at codeforced userdata url
    4. filtering data using filter wrt to problem and ok verdict
    5. deduping the fetched data, filtering unique submission and mapping recently successful resubmission (if any)
    6. finding the submission size of unique map
    7. logging data and 3 recently submitted questions data


# MileStone 6:
    Express backend with cached CF stats + rating history
SQLite-backed problem tracking with a configurable goals system
React dashboard: live CF profile, goal progress, a form to log solves, and a real rating trend chart


Add unit and integration tests
Attach and verify rate limiting
Add retries, timeouts, and circuit-breaker behavior for external platforms
Replace in-memory caching with Redis or a persistent cache
Add background synchronization jobs
Add authentication and user-specific profiles
Dockerize and deploy the application
Add monitoring, structured logging, and API documentation
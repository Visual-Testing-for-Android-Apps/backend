# Database auxiliary files
The database we are currently using is [PostgreSQL](https://www.postgresql.org/) based and hosted on [Heroku](https://dashboard.heroku.com/apps/fit3170-project1-database), with how to interact with it is described below.

The other files in this folder give the definitions of tables for the database. As these files are never directly deployed, they may not reflect the current setup on the active server.

## Local access
 To setup your local access to the database:
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (you may already have this installed, try writing heroku -h).
[Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) is also required to be installed.
- Create a new folder to hold the required repository (this should not be under an existing git repository).
- Run the command ```heroku login```, and login to your Heroku account with your browser as prompted.
- Then run the commands:
  - ```git init```
  - ```heroku git:remote -a fit3170-project1-database```

  Which create an empty repository (required for Heroku) and link it with the remote Heroku app.
- Optionally, you can also install [Postgres](https://devcenter.heroku.com/articles/heroku-postgresql#local-setup) which will allow you to interact with the database from the command line. 

You can now run ```heroku logs -t``` to monitor the server hosting the database,
and ```heroku psql``` (if Postgres was set up) to allow you interact with the database itself.

When using PostgreSQL the command is not executed until a terminating semicolon (;) is reached, allowing you to write command over multiple lines.

## Connecting an app
Connecting an external service to the database can be done using the resulting URL of the command:

```heroku config:get DATABASE_URL -a fit3170-project1-database```

in the folder set up above. This can be done on deployment, but ideally should be run at application start on the server
(the example given by Heroku is: ```DATABASE_URL=$(heroku config:get DATABASE_URL -a fit3170-project1-database) your_process```).

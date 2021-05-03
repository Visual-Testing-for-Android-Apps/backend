# Database auxiliary files
The database we are currently using is [PostgreSQL](https://www.postgresql.org/) based and hosted on [Heroku](https://dashboard.heroku.com/apps/fit3170-project1-database), with how to interact with it is described below.

The other files in this folder give the definitions of tables for the database. As these files are never directly deployed they may not reflect the current setup on the active server.

## Local access
 To setup your local access to the database:
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (you may already have this installed, try writing heroku -h).
[Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) is also required to be installed.
- Create a new folder to hold the required repository (this shouldn't be under an exisiting git repository).
- Run the command ```heroku login```, and login to your Heroku account with your browser as prompted.
- Then run the commands:
  - ```git init```
  - ```heroku git:remote -a fit3170-project1-database```

  Which create an empty repository (required for Heroku) and link it with the remote Heroku app.

You can now run ```heroku logs -t``` to monitor the server hosting the database,
and ```heroku psql``` to allow you iteract with the database itself.

When using psql all commands are not executed until a terminating semicolon (;) is reached, allowing you to write commands over multiple lines.

## Connecting an app
Connecting an external service to the database can be done using the resulting url of the command:

```heroku config:get DATABASE_URL -a fit3170-project1-database```

in the folder set up above. This can be done on deployment, but ideally should be run at application start on the server
(the example given by Heroku is: ```DATABASE_URL=$(heroku config:get DATABASE_URL -a your-app) your_process```).

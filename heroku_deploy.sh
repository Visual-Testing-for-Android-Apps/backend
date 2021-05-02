# make sure you are logged into heroku

git add . && git commit -m "commit message goes here"

# add nodejs buildpack for each app
heroku buildpacks:add -a visiondroid heroku/nodejs
heroku buildpacks:add -a visiondroid2 heroku/nodejs

# add multi-procfile buildpack for each app
heroku buildpacks:add -a visiondroid heroku-community/multi-procfile
heroku buildpacks:add -a visiondroid2 heroku-community/multi-procfile

# set path of profile for each app
heroku config:set -a visiondroid PROCFILE=service1/PROCFILE
heroku config:set -a visiondroid2 PROCFILE=service2/PROCFILE

# push the master/main to heroku, you must use main/master branch otherwise nothin will happen 
git push https://git.heroku.com/visiondroid.git HEAD:main
git push https://git.heroku.com/visiondroid2.git HEAD:main
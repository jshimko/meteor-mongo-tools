
Package.describe({
  name: "ongoworks:mongo-tools",
  summary: "Backup MongoDB to Amazon S3.",
  git: "https://github.com/ongoworks/meteor-mongo-tools.git",
  version: "0.1.0"
});


Npm.depends({
  "mongodb": "2.0.45",
  "mongo-uri": "0.1.2",
  "mongodump-stream": "1.1.1"
});


Package.onUse(function(api) {

  api.versionsFrom("METEOR@1.0");

  api.use("underscore");
  api.use("percolate:synced-cron", "server", { weak: true });

  api.addFiles("mongo-tools.js", "server");

  api.export("MongoTools", "server");

});

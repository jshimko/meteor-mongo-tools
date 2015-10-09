// https://mongodb.github.io/node-mongodb-native/2.0/api/
// https://www.npmjs.com/package/mongo-uri
// https://www.npmjs.com/package/mongodump-stream

var MongoClient = Npm.require('mongodb').MongoClient;
var MongoURI = Npm.require('mongo-uri');
var mds = Npm.require('mongodump-stream');


MongoTools = {

  // defaults
  options: {

    mongoUrl: process.env.MONGO_URL,

    s3: {
      key: null,
      secret: null,
      bucket: null,
      path: null
    }
  },

  // set options
  config: function (opts) {
    this.options = _.extend({}, this.options, opts);
  }

};


/**
 * Run mongodump and stream output to Amazon S3
 *
 * @param {Object}
 *
 *    opts {
 *      url: String,
 *      path: String
 *    }
 */
MongoTools.backup = function (opts) {

  var self = this;
  opts = opts || {};
  var url = opts.url || self.options.mongoUrl;

  try {
    var m = MongoURI.parse(url);
  } catch (err) {
    throw new Meteor.Error(err);
  }

  // build url for just the primary
  var mongoUrl = 'mongodb://' + m.username + ':' + m.password + '@' + m.hosts[0] + ':' + m.ports[0] + '/' + m.database

  // connect directly to mongo
  MongoClient.connect(mongoUrl, Meteor.bindEnvironment(function (err, db) {

    if (err) {
      throw new Meteor.Error(err)
    }

    // grab the database
    var database = db.db(m.database);

    // get all collection names
    database.listCollections().toArray(function (err, collection) {

      if (err) {
        throw new Meteor.Error(err);
      }

      var pathPrefix = opts.path || self.options.s3.path || '';

      // if path is set
      if (!!pathPrefix) {
        // if no trailing slash, add it
        if (pathPrefix.slice(-1) !== '/') {
          pathPrefix += '/';
        }
      }

      var now = Date.now();
      var awsConf = self.options.s3;

      // Dump each collection and stream it to S3.
      // Empty collections will be skipped.
      _.each(collection, function (c) {

        var filename = pathPrefix + now + '/' + c.name + '.bson';
        var stream = mds.slurp.binary(mongoUrl, c.name);

        mds.dump.s3(filename, stream, awsConf).then(function (out) {
          // if collection wasn't empty
          if (out.Location) {
            console.log(c.name + " collection backed up to " + filename);
          }
        });

      });

      db.close();
    });
  }));
};


/**
 * Schedule recurring database dumps to S3
 * @param  {String} schedule - Text parser argument for Later.js
 * @param  {Object} opts     - Options arg for MongoTools.backup()
 */
MongoTools.scheduleBackup = function (schedule, opts) {

  if (typeof Package["percolate:synced-cron"] === 'undefined') {
    console.warn("Error: percolate:synced-cron must be installed to use MongoTools.scheduleBackup()");
    console.warn("*** NO BACKUPS HAVE BEEN SCHEDULED! ***");
    return;
  }

  var self = this;

  SyncedCron.add({
    name: 'MongoTools: backup to S3',
    schedule: function (parser) {
      schedule = schedule || 'every 6 hours';
      return parser.text(schedule);
    },
    job: function() {
      console.log("Backing up database to S3...");
      self.backup(opts);
      return true;
    }
  });

  SyncedCron.start();

};

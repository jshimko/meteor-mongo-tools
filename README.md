# MongoTools for Meteor

This is a work in progress.  Feel free to play with it, but do NOT rely on it for anything important yet!

## Install

Not on Atmosphere yet, so...
```sh
# in the root of your Meteor app
git clone https://github.com/ongoworks/meteor-mongo-tools.git packages/mongo-tools

# then
meteor add ongoworks:mongo-tools
```

This package uses the native `mongodump` utility for dumping databases.  That said, you will need to make sure it's installed on the server that runs your Meteor app (preconfigured Docker image coming soon).

## Setup

First, you need to set some configuration...

```js
MongoTools.config({
  // optional
  mongoUrl: process.env.MONGO_URL, // default

  // required
  s3: {
    key: "YOUR_KEY",
    secret: "YOUR_SECRET",
    bucket: "YOUR_BUCKET",
    path: "some/path/for/output/" // optional
  }
});
```

The `path` key for S3 can be used to set a folder structure for _all_ of your uploads.  You can optionally overwrite that path when running backups.  If you skip the setting the path, the backups will be put in the root of your bucket in a folder named with the current datetime (eg. `1444414042859`).  To have backups go in a specific folder instead, just add any string as the `path` (supports slashes for deeper folder structure).  Note that a trailing slash will always be added if you leave it out, so it's optional when setting the path in your config.

## Usage

There are currently two methods available. Once you've added the config above, both methods can be used with no arguments passed in.  However, you can override the defaults or the global config by passing in new args.

#### MongoTools.backup(options)

Backs up your database immediately.  If called with no arguments, it will use your global config for Mongo URL and output path.  If you want to overwrite the global config for a specific call, you can pass in `url` and `path` options.

```js
// backup using global configs...
MongoTools.backup();


// or use a custom config
var options = {
  url: "mongodb://SOME_OTHER_URL",
  path: "some/other/folder/"
}

MongoTools.backup(options);
```


#### MongoTools.scheduleBackup(schedule, options)

Run the same backup method above, but on a schedule.  This method relies on `percolate:synced-cron` for scheduling (weak dependency, so make sure it's installed if you'd like to use this).

This method takes two arguments.

* `schedule`: `String` - text parser string used by Later.js ([text parser docs](http://bunkat.github.io/later/parsers.html#text))
                        Default: "every 6 hours"
* `options`: `Object` - options object to be passed to `MongoTools.backup()` 
                        Default: global config (see previous section)

So, to run a backup every 2 hours you would do something like this:

```js
Meteor.startup(function () {
  // minimum config required
  MongoTools.config({
    s3: {
      key: "YOUR_KEY",
      secret: "YOUR_SECRET",
      bucket: "YOUR_BUCKET"
    }
  });
  
  // kick off the job
  MongoTools.scheduleBackup("every 2 hours");
});
```

Again, see the [text parser docs](http://bunkat.github.io/later/parsers.html#text) from [Later.js](http://bunkat.github.io/later/index.html) for the options you have for setting schedules.  

Of course, if you want to schedule something more complex, you can setup your own [SyncedCron](https://atmospherejs.com/percolate/synced-cron) job using `MongoTools.backup()`.  This scheduler method is just intended to be a convenience wrapper that covers what most basic backup schedules would need in the simplest way possible.


### More soon...

